import assert from "node:assert/strict";
import test from "node:test";
import { GenericDatabaseAdapter } from "#adapters/database";
import {
  prismaCoreAdapter,
  prismaDatabaseAdapter,
} from "../../../src/adapters/database-prisma/index.ts";
import type { PrismaDatabaseClient } from "../../../src/adapters/database-prisma/prisma-types.ts";
import { makeClient } from "./support.ts";

test("creates an independent Prisma adapter from the public Core contract", async () => {
  let disconnected = false;
  const client = {
    ...makeClient(),
    $queryRaw: async () => [{ value: 1 }],
    $disconnect: async () => {
      disconnected = true;
    },
  } as unknown as PrismaDatabaseClient;

  const adapter = prismaDatabaseAdapter(client);

  assert.equal(adapter instanceof GenericDatabaseAdapter, true);
  assert.equal(typeof prismaCoreAdapter, "function");
  assert.equal(adapter.client, client);
  assert.deepEqual(await adapter.healthCheck?.(), { status: "up" });
  await adapter.dispose?.();
  assert.equal(disconnected, true);
});
