import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();
const loadCore = async () => import(pathToFileURL(path.join(rootDir, "src/core/index.ts")).href);
const loadTesting = async () =>
  import(pathToFileURL(path.join(rootDir, "src/testing/index.ts")).href);

async function createFixture() {
  const core = await loadCore();
  const testing = await loadTesting();
  const users = new Map();
  const credentials = new Map();
  const customers = new Map();
  const transactions: string[] = [];
  const technicalContext = core.SaasBrContext.create({
    clock: testing.createFixedClock(new Date("2026-06-29T12:00:00.000Z")),
    idGenerator: testing.createSequentialIdGenerator("entity"),
    logger: testing.createNoopLogger(),
    transactionManager: {
      runInTransaction: async (callback) => {
        const transaction = { id: `tx_${transactions.length + 1}` };
        transactions.push(transaction.id);
        return callback(transaction);
      },
    },
  });
  const appContext = {
    ...technicalContext,
    auth: {
      passwordHasher: {
        hashPassword: async (password) => `hashed:${password}`,
        verifyPassword: async ({ password, passwordHash }) => passwordHash === `hashed:${password}`,
      },
      users: {
        save: async (user) => users.set(user.id, user),
        findById: async (id) => users.get(id) ?? null,
        findByEmail: async (email) =>
          [...users.values()].find((user) => user.email === email.trim().toLowerCase()) ?? null,
        list: async () => [...users.values()],
      },
      userCredentials: {
        save: async (value) => credentials.set(value.email, value),
        findByEmail: async (email) => credentials.get(email.trim().toLowerCase()) ?? null,
      },
    },
    repositories: {
      customers: {
        save: async (customer) => customers.set(customer.id, customer),
        findById: async (id) => customers.get(id) ?? null,
        findByEmail: async (email) => {
          const normalized = email.trim().toLowerCase();
          return [...customers.values()].find((customer) => customer.email === normalized) ?? null;
        },
        listByOrganizationId: async (organizationId) =>
          [...customers.values()].filter((customer) => customer.organizationId === organizationId),
      },
    },
  };
  return { core, appContext, state: { users, credentials, customers } };
}

test("customer CRUD preserves tenant ownership and soft-disables records", async () => {
  const { core, appContext, state } = await createFixture();
  const tenant = core.ExecutionContext.create({
    requestId: "req_customer",
    actor: { type: "user", id: "actor_1" },
    organizationId: "org_1",
    permissions: ["customers:read", "customers:write"],
  });
  const created = await new core.CreateCustomerUseCase(appContext).execute(tenant, {
    organizationId: "org_1",
    name: "Customer",
    email: "customer@example.com",
    metadata: { preferences: { locale: "pt-BR" }, tags: ["vip"] },
  });
  assert.equal(created.ok, true);

  const read = await new core.GetCustomerUseCase(appContext).execute(tenant, {
    organizationId: "org_1",
    customerId: created.data.id,
  });
  const listed = await new core.ListCustomersUseCase(appContext).execute(tenant, {
    organizationId: "org_1",
  });
  const updated = await new core.UpdateCustomerUseCase(appContext).execute(tenant, {
    organizationId: "org_1",
    customerId: created.data.id,
    name: "Updated customer",
    email: null,
    document: "123456789",
    metadata: null,
  });
  const disabled = await new core.DisableCustomerUseCase(appContext).execute(tenant, {
    organizationId: "org_1",
    customerId: created.data.id,
  });

  assert.equal(read.ok, true);
  assert.equal(listed.ok, true);
  assert.equal(listed.data.length, 1);
  assert.equal(updated.ok, true);
  assert.equal(updated.data.email, undefined);
  assert.equal(updated.data.document, "123456789");
  assert.equal(updated.data.metadata, undefined);
  assert.equal(disabled.ok, true);
  assert.equal(disabled.data.status, "disabled");
  assert.equal(state.customers.size, 1);
});

test("customer CRUD rejects missing permission, wrong tenant and cross-tenant lookup", async () => {
  const { core, appContext } = await createFixture();
  const tenant = core.ExecutionContext.create({
    requestId: "req_customer_owner",
    actor: { type: "user", id: "actor_1" },
    organizationId: "org_1",
    permissions: ["customers:read", "customers:write"],
  });
  const created = await new core.CreateCustomerUseCase(appContext).execute(tenant, {
    organizationId: "org_1",
    name: "Customer",
  });
  assert.equal(created.ok, true);
  const readOnly = core.ExecutionContext.create({
    requestId: "req_read_only",
    actor: { type: "user", id: "actor_1" },
    organizationId: "org_1",
    permissions: ["customers:read"],
  });
  const forbidden = await new core.UpdateCustomerUseCase(appContext).execute(readOnly, {
    organizationId: "org_1",
    customerId: created.data.id,
    name: "Forbidden",
  });
  const wrongScope = await new core.ListCustomersUseCase(appContext).execute(tenant, {
    organizationId: "org_2",
  });
  const system = core.ExecutionContext.create({
    requestId: "req_system_cross_tenant",
    actor: { type: "system" },
  });
  const hidden = await new core.GetCustomerUseCase(appContext).execute(system, {
    organizationId: "org_2",
    customerId: created.data.id,
  });

  assert.equal(forbidden.ok, false);
  assert.equal(forbidden.error.code, "core.permission_denied");
  assert.equal(wrongScope.ok, false);
  assert.equal(wrongScope.error.code, "core.organization_scope_mismatch");
  assert.equal(hidden.ok, false);
  assert.equal(hidden.error.code, "customer.not_found");
});

test("CreateCustomerUseCase rejects duplicate email in the same organization", async () => {
  const { core, appContext } = await createFixture();
  const tenant = core.ExecutionContext.create({
    requestId: "req_customer_duplicate_email",
    actor: { type: "user", id: "actor_1" },
    organizationId: "org_1",
    permissions: ["customers:write"],
  });

  const first = await new core.CreateCustomerUseCase(appContext).execute(tenant, {
    organizationId: "org_1",
    name: "First",
    email: "customer@example.com",
  });
  const duplicate = await new core.CreateCustomerUseCase(appContext).execute(tenant, {
    organizationId: "org_1",
    name: "Second",
    email: " CUSTOMER@example.com ",
  });

  assert.equal(first.ok, true);
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.error.code, "customer.email_conflict");
});

test("CreateCustomerUseCase allows the same email in another organization", async () => {
  const { core, appContext } = await createFixture();
  const tenant = core.ExecutionContext.create({
    requestId: "req_customer_duplicate_email_other_org",
    actor: { type: "user", id: "actor_1" },
    organizationId: "org_1",
    permissions: ["customers:write"],
  });

  const first = await new core.CreateCustomerUseCase(appContext).execute(tenant, {
    organizationId: "org_1",
    name: "First",
    email: "shared@example.com",
  });
  const otherTenant = core.ExecutionContext.create({
    requestId: "req_customer_duplicate_email_other_org_target",
    actor: { type: "user", id: "actor_1" },
    organizationId: "org_2",
    permissions: ["customers:write"],
  });
  const otherOrg = await new core.CreateCustomerUseCase(appContext).execute(tenant, {
    organizationId: "org_2",
    name: "Other org",
    email: " shared@example.com ",
  });
  const otherOrgAllowed = await new core.CreateCustomerUseCase(appContext).execute(otherTenant, {
    organizationId: "org_2",
    name: "Other org",
    email: " shared@example.com ",
  });

  assert.equal(first.ok, true);
  assert.equal(otherOrg.ok, false);
  assert.equal(otherOrgAllowed.ok, true);
});

test("UpdateCustomerUseCase allows unchanged email with other changes and rejects conflicts", async () => {
  const { core, appContext } = await createFixture();
  const tenant = core.ExecutionContext.create({
    requestId: "req_customer_update_email",
    actor: { type: "user", id: "actor_1" },
    organizationId: "org_1",
    permissions: ["customers:write"],
  });

  const first = await new core.CreateCustomerUseCase(appContext).execute(tenant, {
    organizationId: "org_1",
    name: "First",
    email: "first@example.com",
  });
  const second = await new core.CreateCustomerUseCase(appContext).execute(tenant, {
    organizationId: "org_1",
    name: "Second",
    email: "second@example.com",
  });
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);

  const unchangedEmail = await new core.UpdateCustomerUseCase(appContext).execute(tenant, {
    organizationId: "org_1",
    customerId: first.data.id,
    name: "First Updated",
    email: " first@example.com ",
    document: "123456789",
    metadata: { source: "manual" },
  });
  assert.equal(unchangedEmail.ok, true);
  assert.equal(unchangedEmail.data.email, "first@example.com");
  assert.equal(unchangedEmail.data.name, "First Updated");

  const conflict = await new core.UpdateCustomerUseCase(appContext).execute(tenant, {
    organizationId: "org_1",
    customerId: first.data.id,
    email: "SECOND@example.com",
    name: "Should conflict",
  });
  assert.equal(conflict.ok, false);
  assert.equal(conflict.error.code, "customer.email_conflict");
});
