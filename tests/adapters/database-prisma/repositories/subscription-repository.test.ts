import assert from "node:assert/strict";
import test from "node:test";
import { prismaSubscriptionMapper } from "../../../../src/adapters/database-prisma/mappers/subscription-mapper.ts";
import { prismaDatabaseAdapter } from "../../../../src/adapters/database-prisma/prisma-database-adapter.ts";
import { PrismaRepositoryContext } from "../../../../src/adapters/database-prisma/repositories/context.ts";
import { PrismaSubscriptionRepository } from "../../../../src/adapters/database-prisma/repositories/subscription-repository.ts";
import { makeClient, makeDelegate, makeSubscription } from "../support.ts";

test("saves and queries subscriptions", async () => {
  const subscription = makeSubscription();
  const row = prismaSubscriptionMapper.toPersistence(subscription);
  const calls: Record<string, unknown>[] = [];
  const uniqueResults = [row, null];
  const firstResults = [row, null, row, null];
  const delegate = makeDelegate({
    upsert: async (input) => {
      calls.push(input);
    },
    findUnique: async (input) => {
      calls.push(input);
      return uniqueResults.shift() ?? null;
    },
    findFirst: async (input) => {
      calls.push(input);
      return firstResults.shift() ?? null;
    },
  });
  const repository = new PrismaSubscriptionRepository(
    new PrismaRepositoryContext(prismaDatabaseAdapter(makeClient({ subscription: delegate }))),
  );

  await repository.save(subscription);
  assert.deepEqual(calls[0], {
    where: { id: "sub_1" },
    create: row,
    update: row,
  });
  assert.deepEqual(await repository.findById("sub_1"), subscription);
  assert.equal(await repository.findById("missing"), null);
  assert.deepEqual(await repository.findCurrentByOrganizationId("org_1"), subscription);
  assert.deepEqual(calls[3], {
    where: {
      organizationId: "org_1",
      status: { in: ["pending", "incomplete", "trialing", "active", "past_due", "paused"] },
    },
    orderBy: { createdAt: "desc" },
  });
  assert.equal(await repository.findCurrentByOrganizationId("missing"), null);
  assert.deepEqual(
    await repository.findByProviderSubscriptionId({
      provider: "asaas",
      providerSubscriptionId: "provider_sub_1",
      organizationId: "org_1",
      providerConnectionId: "connection_1",
    }),
    subscription,
  );
  assert.deepEqual(calls[5], {
    where: {
      provider: "asaas",
      providerSubscriptionId: "provider_sub_1",
      organizationId: "org_1",
      providerConnectionId: "connection_1",
    },
  });
  assert.equal(
    await repository.findByProviderSubscriptionId({
      provider: "asaas",
      providerSubscriptionId: "missing",
    }),
    null,
  );
  assert.deepEqual(calls[6], {
    where: {
      provider: "asaas",
      providerSubscriptionId: "missing",
    },
  });
});
