import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();

const importCore = () => import(pathToFileURL(path.join(rootDir, "src/core/index.ts")));

test("ExecutionContext.create returns an immutable isolated operation context", async () => {
  const { ExecutionContext } = await importCore();
  const actor = { type: "user", id: "user_1" };
  const permissions = ["billing:read"];
  const metadata = { source: "http" };

  const context = ExecutionContext.create({
    requestId: "req_1",
    actor,
    organizationId: "org_1",
    permissions,
    metadata,
  });

  actor.id = "user_2";
  permissions.push("billing:write");
  metadata.source = "worker";

  assert.equal(context instanceof ExecutionContext, true);
  assert.deepEqual(
    { ...context },
    {
      requestId: "req_1",
      actor: { type: "user", id: "user_1" },
      organizationId: "org_1",
      permissions: ["billing:read"],
      metadata: { source: "http" },
    },
  );
  assert.equal(Object.isFrozen(context), true);
  assert.equal(Object.isFrozen(context.actor), true);
  assert.equal(Object.isFrozen(context.permissions), true);
  assert.equal(Object.isFrozen(context.metadata), true);
  assert.throws(() => Object.assign(context, { requestId: "req_2" }), TypeError);
  assert.throws(() => context.permissions.push("billing:delete"), TypeError);
});

test("ExecutionContext.create defaults permissions without sharing mutable state", async () => {
  const { ExecutionContext } = await importCore();

  const first = ExecutionContext.create({
    requestId: "req_1",
    actor: { type: "system" },
  });
  const second = ExecutionContext.create({
    requestId: "req_2",
    actor: { type: "system", id: "job_1" },
  });

  assert.deepEqual(first.permissions, []);
  assert.deepEqual(second.permissions, []);
  assert.notEqual(first.permissions, second.permissions);
  assert.equal("organizationId" in first, false);
  assert.equal("metadata" in first, false);
});
