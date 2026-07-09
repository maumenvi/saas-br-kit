import assert from "node:assert/strict";
import test from "node:test";
import { prismaWebhookEventMapper } from "../../../../src/adapters/database-prisma/mappers/webhook-event-mapper.ts";
import { prismaDatabaseAdapter } from "../../../../src/adapters/database-prisma/prisma-database-adapter.ts";
import { PrismaRepositoryContext } from "../../../../src/adapters/database-prisma/repositories/context.ts";
import { PrismaWebhookEventRepository } from "../../../../src/adapters/database-prisma/repositories/webhook-event-repository.ts";
import { makeClient, makeDelegate, makeWebhookEvent } from "../support.ts";

test("inserts new webhooks and returns existing idempotent events", async () => {
  const event = makeWebhookEvent();
  const row = prismaWebhookEventMapper.toPersistence(event);
  const created: unknown[] = [];
  const findResults = [null, row];
  const delegate = makeDelegate({
    findUnique: async () => findResults.shift() ?? null,
    create: async (input) => {
      created.push(input);
    },
  });
  const repository = new PrismaWebhookEventRepository(
    new PrismaRepositoryContext(prismaDatabaseAdapter(makeClient({ webhookEvent: delegate }))),
  );

  assert.deepEqual(await repository.insertIfNotExists(event), { inserted: true, event });
  assert.deepEqual(created, [{ data: row }]);
  assert.deepEqual(await repository.insertIfNotExists(event), { inserted: false, event });
  assert.equal(created.length, 1);
});

test("saves and queries webhook events", async () => {
  const event = makeWebhookEvent();
  const row = prismaWebhookEventMapper.toPersistence(event);
  const calls: Record<string, unknown>[] = [];
  const results = [row, null, row];
  const delegate = makeDelegate({
    upsert: async (input) => {
      calls.push(input);
    },
    findUnique: async (input) => {
      calls.push(input);
      return results.shift() ?? null;
    },
  });
  const repository = new PrismaWebhookEventRepository(
    new PrismaRepositoryContext(prismaDatabaseAdapter(makeClient({ webhookEvent: delegate }))),
  );

  await repository.save(event);
  assert.deepEqual(calls[0], {
    where: { id: "webhook_1" },
    create: row,
    update: row,
  });
  assert.deepEqual(await repository.findById("webhook_1"), event);
  assert.equal(await repository.findById("missing"), null);
  assert.deepEqual(
    await repository.findByProviderEventId({
      provider: "asaas",
      providerEventId: "event_1",
    }),
    event,
  );
  assert.deepEqual(calls[3], {
    where: {
      provider_providerEventId: {
        provider: "asaas",
        providerEventId: "event_1",
      },
    },
  });
});
