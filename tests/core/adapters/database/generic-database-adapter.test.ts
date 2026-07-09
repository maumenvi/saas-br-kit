import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();

test("database adapter builder preserves native client and exposes transaction manager", async () => {
  const { GenericDatabaseAdapter } = await import(
    pathToFileURL(path.join(rootDir, "src/adapters/database/index.ts"))
  );

  const calls = [];
  const transactionClient = {
    queryRaw: async (query) => {
      calls.push(`tx:${query}`);
      return ["tx"];
    },
  };
  const client = {
    queryRaw: async (query) => {
      calls.push(`client:${query}`);
      return ["client"];
    },
    transaction: async (operation) => operation(transactionClient),
  };

  const database = new GenericDatabaseAdapter({
    name: "fixture",
    client,
    transaction: {
      run: (client, operation) => client.transaction(operation),
    },
    healthCheck: async (client) => {
      await client.queryRaw("SELECT 1");
      return { status: "up" };
    },
    dispose: async () => undefined,
  });

  assert.equal(database instanceof GenericDatabaseAdapter, true);
  assert.equal(database.getClient(), client);
  assert.deepEqual(await database.client.queryRaw("SELECT client"), ["client"]);
  assert.deepEqual(await database.withTransaction((db) => db.queryRaw("SELECT tx")), ["tx"]);
  assert.deepEqual(await database.healthCheck(), { status: "up" });

  await database.transactionManager.runInTransaction(async (transaction) => {
    assert.equal(database.getClient(transaction), transactionClient);
    await database.getClient(transaction).queryRaw("SELECT scoped");
  });

  assert.throws(
    () => database.getClient({ id: "missing" }),
    /Transaction scope is not active for this database adapter/,
  );
  assert.deepEqual(calls, [
    "client:SELECT client",
    "tx:SELECT tx",
    "client:SELECT 1",
    "tx:SELECT scoped",
  ]);
});
