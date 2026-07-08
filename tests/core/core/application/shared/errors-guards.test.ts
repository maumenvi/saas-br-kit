import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();
const loadCore = async () => import(pathToFileURL(path.join(rootDir, "src/core/index.ts")).href);
const loadErrors = async () =>
  import(pathToFileURL(path.join(rootDir, "src/core/application/shared/errors.ts")).href);
const loadGuards = async () =>
  import(pathToFileURL(path.join(rootDir, "src/core/application/shared/guards.ts")).href);
const loadUseCaseRunner = async () =>
  import(pathToFileURL(path.join(rootDir, "src/core/application/shared/use-case.ts")).href);

test("ApplicationFailureFactory creates normalized failure results and facades", async () => {
  const {
    ApplicationFailureFactory,
    createAuthorizationFailure,
    createConflictFailure,
    createExternalFailure,
    createNotFoundFailure,
  } = await loadErrors();
  const factory = new ApplicationFailureFactory();
  const details = { reason: "fixture" };

  const authorization = factory.authorization("auth.denied", "Denied", details);
  const conflict = factory.conflict("state.conflict", "Conflict");
  const notFound = factory.notFound("entity.missing", "Missing");
  const external = factory.external("provider.down", "Provider down", details);

  details.reason = "mutated";

  assert.equal(authorization.ok, false);
  if (!authorization.ok) {
    assert.equal(authorization.error.kind, "authorization");
    assert.deepEqual(authorization.error.details, { reason: "fixture" });
    assert.equal(Object.isFrozen(authorization.error.details), true);
  }

  assert.equal(conflict.ok, false);
  if (!conflict.ok) {
    assert.equal(conflict.error.kind, "conflict");
  }

  assert.equal(notFound.ok, false);
  if (!notFound.ok) {
    assert.equal(notFound.error.kind, "not_found");
  }

  assert.equal(external.ok, false);
  if (!external.ok) {
    assert.equal(external.error.kind, "external");
    assert.equal(external.error.retryable, true);
  }

  const facadeAuth = createAuthorizationFailure("a", "b");
  const facadeConflict = createConflictFailure("a", "b");
  const facadeNotFound = createNotFoundFailure("a", "b");
  const facadeExternal = createExternalFailure("a", "b");

  assert.equal(facadeAuth.ok, false);
  assert.equal(facadeConflict.ok, false);
  assert.equal(facadeNotFound.ok, false);
  assert.equal(facadeExternal.ok, false);
});

test("ExecutionPolicy validates actor, tenant and permission branches plus facades", async () => {
  const core = await loadCore();
  const { ExecutionPolicy, ensureActorCanRepresentUser, ensurePermission, ensureTenantScope } =
    await loadGuards();
  const policy = new ExecutionPolicy();

  const system = core.ExecutionContext.create({
    requestId: "req_system",
    actor: { type: "system" },
  });
  const user = core.ExecutionContext.create({
    requestId: "req_user",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_1",
    permissions: ["billing:read"],
  });
  const service = core.ExecutionContext.create({
    requestId: "req_service",
    actor: { type: "service", id: "svc_1" },
  });
  const wildcard = core.ExecutionContext.create({
    requestId: "req_wildcard",
    actor: { type: "user", id: "user_2" },
    organizationId: "org_2",
    permissions: ["*"],
  });

  assert.equal(policy.ensureActorCanRepresentUser(system, "user_1").ok, true);
  assert.equal(policy.ensureActorCanRepresentUser(user, "user_1").ok, true);
  assert.equal(policy.ensureActorCanRepresentUser(service, "user_1").ok, false);
  assert.equal(policy.ensureActorCanRepresentUser(user, "user_2").ok, false);

  assert.equal(policy.ensureTenantScope(system, "org_1").ok, true);
  assert.equal(policy.ensureTenantScope(user, "org_1").ok, true);
  assert.equal(policy.ensureTenantScope(user, "org_2").ok, false);
  assert.equal(policy.ensureTenantScope(service, "org_1").ok, false);

  assert.equal(policy.ensurePermission(system, "billing:write").ok, true);
  assert.equal(policy.ensurePermission(user, "billing:read").ok, true);
  assert.equal(policy.ensurePermission(wildcard, "billing:write").ok, true);

  const denied = policy.ensurePermission(user, "billing:write");
  assert.equal(denied.ok, false);
  if (!denied.ok) {
    assert.equal(denied.error.code, "core.permission_denied");
    assert.deepEqual(denied.error.details, { permission: "billing:write" });
  }

  assert.equal(ensureActorCanRepresentUser(user, "user_1").ok, true);
  assert.equal(ensureTenantScope(user, "org_1").ok, true);
  assert.equal(ensurePermission(user, "billing:read").ok, true);
});

test("UseCaseRunner maps missing functionality errors to expected Result failures", async () => {
  const core = await loadCore();
  const { UseCaseRunner } = await loadUseCaseRunner();
  const runner = new UseCaseRunner();

  const result = await runner.runSafely(async () => {
    throw new core.CoreFunctionalityNotConfiguredError("repositories.plans");
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.kind, "infrastructure");
    assert.equal(result.error.code, "core.functionality_not_configured");
    assert.deepEqual(result.error.details, { functionality: "repositories.plans" });
  }
});
