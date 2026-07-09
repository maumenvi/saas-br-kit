import assert from "node:assert/strict";
import test from "node:test";
import { prismaDatabaseAdapter } from "../../../../src/adapters/database-prisma/prisma-database-adapter.ts";
import type {
  PrismaDatabaseClient,
  PrismaTransactionClient,
} from "../../../../src/adapters/database-prisma/prisma-types.ts";
import { PrismaRepositoryContext } from "../../../../src/adapters/database-prisma/repositories/context.ts";
import { makeClient } from "../support.ts";

test("resolves root and active transaction clients", async () => {
  const transactionClient = { transaction: true } as unknown as PrismaTransactionClient;
  const client = {
    ...makeClient(),
    $transaction: async (operation) => operation(transactionClient),
  } satisfies PrismaDatabaseClient;
  const database = prismaDatabaseAdapter(client);
  const context = new PrismaRepositoryContext(database);

  assert.equal(context.getClient(), client);
  await database.transactionManager.runInTransaction(async (transaction) => {
    assert.equal(context.getClient({ transaction }), transactionClient);
  });
});

test("rejects inactive transaction scopes", () => {
  const context = new PrismaRepositoryContext(prismaDatabaseAdapter(makeClient()));

  assert.throws(
    () => context.getClient({ transaction: { id: "inactive" } }),
    /Transaction scope is not active/,
  );
});
