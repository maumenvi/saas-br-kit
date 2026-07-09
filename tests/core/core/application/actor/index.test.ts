import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();
const loadCore = async () => import(pathToFileURL(path.join(rootDir, "src/core/index.ts")));
const loadTesting = async () => import(pathToFileURL(path.join(rootDir, "src/testing/index.ts")));

async function createFixture() {
  const core = await loadCore();
  const testing = await loadTesting();
  const users = new Map();
  const credentials = new Map();
  const customers = new Map();
  const transactions = [];
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

test("actor CRUD hashes credentials, lists, updates and soft-disables", async () => {
  const { core, appContext, state } = await createFixture();
  const administrator = core.ExecutionContext.create({
    requestId: "req_actor_admin",
    actor: { type: "system" },
  });
  const created = await new core.CreateActorUseCase(appContext).execute(administrator, {
    email: " Actor@Example.com ",
    password: "strong-password",
    displayName: "Initial name",
  });
  assert.equal(created.ok, true);
  assert.equal(created.data.email, "actor@example.com");
  assert.equal(state.credentials.get("actor@example.com").passwordHash, "hashed:strong-password");

  const actorContext = core.ExecutionContext.create({
    requestId: "req_actor_self",
    actor: { type: "user", id: created.data.id },
  });
  const read = await new core.GetActorUseCase(appContext).execute(actorContext, {
    actorId: created.data.id,
  });
  const listed = await new core.ListActorsUseCase(appContext).execute(administrator);
  const updated = await new core.UpdateActorUseCase(appContext).execute(actorContext, {
    actorId: created.data.id,
    displayName: "Updated name",
  });
  const disabled = await new core.DisableActorUseCase(appContext).execute(administrator, {
    actorId: created.data.id,
  });

  assert.equal(read.ok, true);
  assert.equal(listed.ok, true);
  assert.equal(listed.data.length, 1);
  assert.equal(updated.ok, true);
  assert.equal(updated.data.displayName, "Updated name");
  assert.equal(disabled.ok, true);
  assert.equal(disabled.data.status, "disabled");
  assert.equal(state.users.size, 1);
  assert.equal(state.users.get(created.data.id).status, "disabled");
});

test("actor CRUD reports conflicts, missing actors and representation failures", async () => {
  const { core, appContext } = await createFixture();
  const system = core.ExecutionContext.create({
    requestId: "req_system",
    actor: { type: "system" },
  });
  const first = await new core.CreateActorUseCase(appContext).execute(system, {
    email: "duplicate@example.com",
    password: "password-one",
  });
  assert.equal(first.ok, true);
  const duplicate = await new core.CreateActorUseCase(appContext).execute(system, {
    email: "DUPLICATE@example.com",
    password: "password-two",
  });
  const missing = await new core.GetActorUseCase(appContext).execute(system, {
    actorId: "missing",
  });
  const otherActor = core.ExecutionContext.create({
    requestId: "req_other",
    actor: { type: "user", id: "other" },
  });
  const forbidden = await new core.GetActorUseCase(appContext).execute(otherActor, {
    actorId: first.data.id,
  });

  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.error.code, "actor.email_conflict");
  assert.equal(missing.ok, false);
  assert.equal(missing.error.code, "actor.not_found");
  assert.equal(forbidden.ok, false);
  assert.equal(forbidden.error.code, "core.actor_user_mismatch");
});

test("actor create works with capabilities-only persistence functions", async () => {
  const core = await loadCore();
  const testing = await loadTesting();
  const users = new Map();
  const credentials = new Map();

  const appContext = {
    ...core.SaasBrContext.create({
      clock: testing.createFixedClock(new Date("2026-06-29T12:00:00.000Z")),
      idGenerator: testing.createSequentialIdGenerator("cap"),
      logger: testing.createNoopLogger(),
      transactionManager: testing.createPassthroughTransactionManager(),
    }),
    auth: {
      passwordHasher: {
        hashPassword: async (password) => `hashed:${password}`,
        verifyPassword: async ({ password, passwordHash }) => passwordHash === `hashed:${password}`,
      },
      capabilities: {
        users: {
          findUserById: async (userId) => users.get(userId) ?? null,
          findUserByEmail: async (email) =>
            [...users.values()].find((user) => user.email === email.trim().toLowerCase()) ?? null,
          listUsers: async () => [...users.values()],
          insertUser: async (user) => {
            users.set(user.id, user);
          },
          updateUser: async (user) => {
            users.set(user.id, user);
          },
        },
        userCredentials: {
          findCredentialsByEmail: async (email) =>
            credentials.get(email.trim().toLowerCase()) ?? null,
          insertCredentials: async (value) => {
            credentials.set(value.email, value);
          },
        },
      },
    },
  };

  const system = core.ExecutionContext.create({
    requestId: "req_actor_capabilities",
    actor: { type: "system" },
  });

  const created = await new core.CreateActorUseCase(appContext).execute(system, {
    email: "cap-user@example.com",
    password: "strong-password",
  });

  assert.equal(created.ok, true);
  assert.equal(users.has(created.data.id), true);
  assert.equal(credentials.get("cap-user@example.com").userId, created.data.id);
});
