import assert from "node:assert/strict";
import test from "node:test";
import { GenericDatabaseAdapter } from "#adapters/database";
import { prismaDatabaseAdapter } from "../../../src/adapters/database-prisma/prisma-database-adapter.ts";
import type {
  PrismaDatabaseClient,
  PrismaTransactionClient,
} from "../../../src/adapters/database-prisma/prisma-types.ts";
import { makeClient } from "./support.ts";

test("creates the configured Prisma database adapter", async () => {
  const transactionClient = { transaction: true } as unknown as PrismaTransactionClient;
  const queried: string[] = [];
  let disconnected = false;
  const baseClient = makeClient();
  const client = {
    ...baseClient,
    $transaction: async (operation) => operation(transactionClient),
    $queryRaw: async (strings) => {
      queried.push(strings.join(""));
      return [{ value: 1 }];
    },
    $disconnect: async () => {
      disconnected = true;
    },
  } satisfies PrismaDatabaseClient;

  const adapter = prismaDatabaseAdapter(client);

  assert.equal(adapter instanceof GenericDatabaseAdapter, true);
  assert.equal(adapter.name, "postgres-prisma");
  assert.equal(adapter.client, client);
  assert.equal(
    await adapter.withTransaction(async (transaction) => transaction),
    transactionClient,
  );
  assert.deepEqual(await adapter.healthCheck?.(), { status: "up" });
  assert.deepEqual(queried, ["SELECT 1"]);
  await adapter.dispose?.();
  assert.equal(disconnected, true);
});

test("supports clients without optional health query and disconnect methods", async () => {
  const adapter = prismaDatabaseAdapter(makeClient());

  assert.deepEqual(await adapter.healthCheck?.(), { status: "up" });
  await adapter.dispose?.();
});
