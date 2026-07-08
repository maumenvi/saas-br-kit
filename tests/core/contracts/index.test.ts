import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();

const loadContracts = async () =>
  import(pathToFileURL(path.join(rootDir, "src/contracts/index.ts")));

test("contracts expose dependency-free schemas for public billing slice DTOs", async () => {
  const {
    billingEventDtoSchema,
    createOrganizationInputSchema,
    createPlanInputSchema,
    createSubscriptionInputSchema,
    organizationDtoSchema,
    planDtoSchema,
    subscriptionDtoSchema,
    validateSchema,
  } = await loadContracts();

  assert.equal(
    validateSchema(createOrganizationInputSchema, {
      ownerUserId: "user_1",
      name: "Minha empresa",
      metadata: {
        source: "self-service",
        seats: 10,
        tags: ["trial", "clinic"],
        preferences: { locale: "pt-BR", notifications: true },
      },
    }).ok,
    true,
  );

  assert.equal(
    validateSchema(organizationDtoSchema, {
      id: "org_1",
      ownerUserId: "user_1",
      name: "Minha empresa",
      status: "active",
      createdAt: "2026-06-18T12:00:00.000Z",
      updatedAt: "2026-06-18T12:00:00.000Z",
      metadata: {
        source: "self-service",
        seats: 10,
        migrated: false,
        legacyId: null,
      },
    }).ok,
    true,
  );

  assert.equal(
    validateSchema(createPlanInputSchema, {
      organizationId: "org_1",
      code: "starter",
      name: "Starter",
      amountCents: 9900,
      interval: "monthly",
      features: ["billing", "tenant"],
      metadata: { source: "catalog" },
    }).ok,
    true,
  );

  assert.equal(
    validateSchema(planDtoSchema, {
      id: "plan_1",
      organizationId: "org_1",
      code: "starter",
      name: "Starter",
      price: {
        amountCents: 9900,
        currency: "BRL",
        interval: "monthly",
      },
      features: ["billing"],
      status: "active",
      createdAt: "2026-06-18T12:00:00.000Z",
      updatedAt: "2026-06-18T12:00:00.000Z",
      metadata: { source: "catalog" },
    }).ok,
    true,
  );

  assert.equal(
    validateSchema(createSubscriptionInputSchema, {
      organizationId: "org_1",
      userId: "user_1",
      planId: "plan_1",
      customerId: "customer_1",
      metadata: { campaign: "launch" },
    }).ok,
    true,
  );

  assert.equal(
    validateSchema(subscriptionDtoSchema, {
      id: "sub_1",
      organizationId: "org_1",
      userId: "user_1",
      planId: "plan_1",
      status: "active",
      provider: "asaas",
      providerConnectionId: "conn_1",
      providerCustomerId: "cust_1",
      providerSubscriptionId: "prov_sub_1",
      currentPeriodStart: "2026-06-01T00:00:00.000Z",
      currentPeriodEnd: "2026-07-01T00:00:00.000Z",
      createdAt: "2026-06-18T12:00:00.000Z",
      updatedAt: "2026-06-18T12:00:00.000Z",
      metadata: { campaign: "launch" },
    }).ok,
    true,
  );

  assert.equal(
    validateSchema(billingEventDtoSchema, {
      id: "evt_1",
      type: "subscription_created",
      occurredAt: "2026-06-18T12:00:00.000Z",
      organizationId: "org_1",
      planId: "plan_1",
      subscriptionId: "sub_1",
      metadata: { provider: "asaas" },
    }).ok,
    true,
  );
});

test("contracts reject invalid public DTO values", async () => {
  const {
    billingEventDtoSchema,
    createOrganizationInputSchema,
    createPlanInputSchema,
    createSubscriptionInputSchema,
    organizationDtoSchema,
    validateSchema,
  } = await loadContracts();

  const invalidOrganization = validateSchema(organizationDtoSchema, {
    id: "org_1",
    ownerUserId: "user_1",
    name: "Minha empresa",
    status: "archived",
    createdAt: "2026-06-18T12:00:00.000Z",
    updatedAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(invalidOrganization.ok, false);
  assert.deepEqual(invalidOrganization.issues[0].path, ["status"]);

  const validNestedOrganization = validateSchema(createOrganizationInputSchema, {
    ownerUserId: "user_1",
    name: "Minha empresa",
    metadata: { nested: { supported: true }, items: [{ id: 1 }, { id: 2 }] },
  });
  assert.equal(validNestedOrganization.ok, true);

  const invalidMissingOwner = validateSchema(createOrganizationInputSchema, {
    name: "Sem owner",
  });
  assert.equal(invalidMissingOwner.ok, false);

  const invalidPlan = validateSchema(createPlanInputSchema, {
    organizationId: "org_1",
    code: "starter",
    name: "Starter",
    amountCents: 0,
    interval: "weekly",
  });
  assert.equal(invalidPlan.ok, false);

  const invalidPlanWithoutOrganization = validateSchema(createPlanInputSchema, {
    code: "starter",
    name: "Starter",
    amountCents: 9900,
    interval: "monthly",
  });
  assert.equal(invalidPlanWithoutOrganization.ok, false);
  assert.deepEqual(invalidPlanWithoutOrganization.issues[0].path, ["organizationId"]);

  const validPlanMetadata = validateSchema(createPlanInputSchema, {
    organizationId: "org_1",
    code: "starter",
    name: "Starter",
    amountCents: 9900,
    interval: "monthly",
    metadata: { nested: { supported: true } },
  });
  assert.equal(validPlanMetadata.ok, true);

  const invalidSubscription = validateSchema(createSubscriptionInputSchema, {
    organizationId: "org_1",
    userId: "user_1",
    planId: "plan_1",
    customerId: "",
  });
  assert.equal(invalidSubscription.ok, false);

  const validSubscriptionMetadata = validateSchema(createSubscriptionInputSchema, {
    organizationId: "org_1",
    userId: "user_1",
    planId: "plan_1",
    customerId: "customer_1",
    metadata: { nested: { supported: true }, flags: [true, false] },
  });
  assert.equal(validSubscriptionMetadata.ok, true);

  const invalidBillingEvent = validateSchema(billingEventDtoSchema, {
    id: "evt_1",
    type: "unknown_webhook",
    occurredAt: "not-a-date",
  });
  assert.equal(invalidBillingEvent.ok, false);
});

test("persistence schemas intentionally share public entity DTO shapes", async () => {
  const {
    billingEventDtoSchema,
    billingEventPersistenceSchema,
    organizationDtoSchema,
    organizationPersistenceSchema,
    planDtoSchema,
    planPersistenceSchema,
    subscriptionDtoSchema,
    subscriptionPersistenceSchema,
  } = await loadContracts();

  assert.equal(organizationPersistenceSchema, organizationDtoSchema);
  assert.equal(planPersistenceSchema, planDtoSchema);
  assert.equal(subscriptionPersistenceSchema, subscriptionDtoSchema);
  assert.equal(billingEventPersistenceSchema, billingEventDtoSchema);
});

test("actor and customer contracts validate public registration and login objects", async () => {
  const {
    actorDtoSchema,
    changePasswordInputSchema,
    createAccountInputSchema,
    createActorInputSchema,
    createCustomerInputSchema,
    customerDtoSchema,
    loginInputSchema,
    validateSchema,
  } = await loadContracts();
  assert.equal(
    validateSchema(createActorInputSchema, {
      email: "actor@example.com",
      password: "strong-password",
      displayName: "Actor",
    }).ok,
    true,
  );
  assert.equal(
    validateSchema(createAccountInputSchema, {
      email: "actor@example.com",
      password: "strong-password",
      displayName: "Actor",
      organizationName: "Minha empresa",
      organizationSubdomain: "minha-empresa",
      organizationUrl: "https://minha-empresa.example.com",
    }).ok,
    true,
  );
  assert.equal(
    validateSchema(changePasswordInputSchema, {
      currentPassword: "senha-segura",
      newPassword: "senha-ainda-mais-segura",
    }).ok,
    true,
  );
  assert.equal(
    validateSchema(changePasswordInputSchema, {
      currentPassword: "senha-segura",
      newPassword: "senha-segura",
    }).ok,
    false,
  );
  assert.equal(
    validateSchema(loginInputSchema, {
      email: "actor@example.com",
      password: "strong-password",
      organizationUrl: "https://store.example.com",
    }).ok,
    true,
  );
  assert.equal(
    validateSchema(actorDtoSchema, {
      id: "actor_1",
      email: "actor@example.com",
      status: "active",
      createdAt: "2026-06-18T12:00:00.000Z",
      updatedAt: "2026-06-18T12:00:00.000Z",
    }).ok,
    true,
  );
  assert.equal(
    validateSchema(createCustomerInputSchema, {
      organizationId: "org_1",
      name: "Customer",
      email: "customer@example.com",
      metadata: { tags: ["vip"], nested: { score: 10 } },
    }).ok,
    true,
  );
  assert.equal(
    validateSchema(customerDtoSchema, {
      id: "customer_1",
      organizationId: "org_1",
      name: "Customer",
      status: "active",
      createdAt: "2026-06-18T12:00:00.000Z",
      updatedAt: "2026-06-18T12:00:00.000Z",
    }).ok,
    true,
  );
  assert.equal(
    validateSchema(createAccountInputSchema, {
      email: "actor@example.com",
      password: "short",
      organizationName: "Minha empresa",
    }).ok,
    false,
  );
});

test("subscription contract requires customerId", async () => {
  const { createSubscriptionInputSchema, validateSchema } = await loadContracts();
  const base = {
    organizationId: "org_1",
    userId: "actor_1",
    planId: "plan_1",
  };
  assert.equal(
    validateSchema(createSubscriptionInputSchema, {
      ...base,
      customerId: "customer_1",
    }).ok,
    true,
  );
  assert.equal(
    validateSchema(createSubscriptionInputSchema, {
      ...base,
      customerId: "",
    }).ok,
    false,
  );
  assert.equal(validateSchema(createSubscriptionInputSchema, base).ok, false);
});

test("execution context contracts validate actors, permissions and metadata", async () => {
  const { executionActorSchema, executionContextSchema, validateSchema } = await loadContracts();

  const systemNoId = validateSchema(executionActorSchema, { type: "system" });
  const systemWithId = validateSchema(executionActorSchema, { type: "system", id: "sys_1" });
  const userActor = validateSchema(executionActorSchema, { type: "user", id: "user_1" });
  const serviceActor = validateSchema(executionActorSchema, { type: "service", id: "svc_1" });
  const invalidUserId = validateSchema(executionActorSchema, { type: "user", id: "" });
  const invalidActorType = validateSchema(executionActorSchema, { type: "bot", id: "b" });
  const invalidActorShape = validateSchema(executionActorSchema, "not-an-actor");

  assert.equal(systemNoId.ok, true);
  assert.equal(systemWithId.ok, true);
  assert.equal(userActor.ok, true);
  assert.equal(serviceActor.ok, true);
  assert.equal(invalidUserId.ok, false);
  assert.equal(invalidActorType.ok, false);
  assert.equal(invalidActorShape.ok, false);

  const validContextWithDefaults = validateSchema(executionContextSchema, {
    requestId: "req_1",
    actor: { type: "system" },
  });
  const validContextFull = validateSchema(executionContextSchema, {
    requestId: "req_2",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_1",
    permissions: ["billing:read", "*"],
    metadata: { source: "api", nested: { path: "/hooks" } },
  });
  const invalidPermissions = validateSchema(executionContextSchema, {
    requestId: "req_3",
    actor: { type: "service", id: "svc_1" },
    permissions: ["ok", ""],
  });
  const invalidMetadata = validateSchema(executionContextSchema, {
    requestId: "req_4",
    actor: { type: "system" },
    metadata: ["not", "record"],
  });
  const invalidContextShape = validateSchema(executionContextSchema, "not-an-object");
  const invalidPermissionsShape = validateSchema(executionContextSchema, {
    requestId: "req_5",
    actor: { type: "system" },
    permissions: "not-array",
  });
  const invalidSystemId = validateSchema(executionActorSchema, { type: "system", id: "" });

  assert.equal(validContextWithDefaults.ok, true);
  assert.equal(validContextFull.ok, true);
  assert.equal(invalidPermissions.ok, false);
  assert.equal(invalidMetadata.ok, false);
  assert.equal(invalidContextShape.ok, false);
  assert.equal(invalidPermissionsShape.ok, false);
  assert.equal(invalidSystemId.ok, false);
});

test("result and core error contracts validate success and failure branches", async () => {
  const {
    ContractSchema,
    coreErrorKindSchema,
    coreErrorSchema,
    failureResultSchema,
    resultSchema,
    successResultSchema,
    validateSchema,
  } = await loadContracts();
  const numberSchema = new ContractSchema<number>("number", (value, path) => {
    return typeof value === "number"
      ? { ok: true, value }
      : { ok: false, issues: [{ path, message: "Expected number." }] };
  });

  const successSchema = successResultSchema(numberSchema);
  const failureSchema = failureResultSchema();
  const unionSchema = resultSchema(numberSchema);

  assert.equal(validateSchema(coreErrorKindSchema, "authorization").ok, true);
  assert.equal(validateSchema(coreErrorKindSchema, "invalid").ok, false);

  const validError = validateSchema(coreErrorSchema, {
    kind: "domain",
    code: "fixture.error",
    message: "Expected error",
    details: { reason: "fixture" },
    retryable: true,
  });
  const invalidError = validateSchema(coreErrorSchema, {
    kind: "domain",
    code: "",
    message: "x",
    details: ["not", "record"],
    retryable: "yes",
  });
  const invalidErrorShape = validateSchema(coreErrorSchema, "not-an-error");

  assert.equal(validError.ok, true);
  assert.equal(invalidError.ok, false);
  assert.equal(invalidErrorShape.ok, false);

  assert.equal(validateSchema(successSchema, { ok: true, data: 1 }).ok, true);
  assert.equal(validateSchema(successSchema, { ok: false, data: 1 }).ok, false);
  assert.equal(validateSchema(successSchema, { ok: true, data: "1" }).ok, false);
  assert.equal(validateSchema(successSchema, "invalid-shape").ok, false);

  assert.equal(
    validateSchema(failureSchema, {
      ok: false,
      error: {
        kind: "infrastructure",
        code: "dep.failure",
        message: "Dependency failed",
      },
    }).ok,
    true,
  );
  assert.equal(validateSchema(failureSchema, { ok: true, error: {} }).ok, false);
  assert.equal(validateSchema(failureSchema, "invalid-shape").ok, false);

  const customFailureSchema = failureResultSchema(
    new ContractSchema<{ reason: string }>("customError", (value, path) => {
      if (
        typeof value === "object" &&
        value !== null &&
        "reason" in value &&
        typeof (value as { reason?: unknown }).reason === "string"
      ) {
        return { ok: true, value: { reason: (value as { reason: string }).reason } };
      }

      return { ok: false, issues: [{ path, message: "Expected custom error." }] };
    }),
  );

  assert.equal(
    validateSchema(customFailureSchema, {
      ok: false,
      error: { reason: "custom" },
    }).ok,
    true,
  );
  assert.equal(
    validateSchema(customFailureSchema, {
      ok: false,
      error: { reason: 1 },
    }).ok,
    false,
  );

  assert.equal(validateSchema(unionSchema, { ok: true, data: 10 }).ok, true);
  assert.equal(
    validateSchema(unionSchema, {
      ok: false,
      error: {
        kind: "authorization",
        code: "denied",
        message: "Denied",
      },
    }).ok,
    true,
  );
  assert.equal(validateSchema(unionSchema, { ok: "maybe", data: 10 }).ok, false);
  assert.equal(validateSchema(unionSchema, null).ok, false);
});
