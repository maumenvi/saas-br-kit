import assert from "node:assert/strict";
import test from "node:test";
import { prismaSubscriptionMapper } from "../../../../src/adapters/database-prisma/mappers/subscription-mapper.ts";
import { laterTimestamp, makeSubscription, timestamp } from "../support.ts";

test("maps subscriptions to persistence and back", () => {
  const subscription = makeSubscription();
  const persisted = prismaSubscriptionMapper.toPersistence(subscription);

  assert.deepEqual(persisted, {
    id: "sub_1",
    organizationId: "org_1",
    userId: "user_1",
    planId: "plan_1",
    status: "active",
    provider: "asaas",
    providerConnectionId: "connection_1",
    providerCustomerId: "customer_1",
    providerSubscriptionId: "provider_sub_1",
    currentPeriodStart: new Date(timestamp),
    currentPeriodEnd: new Date(laterTimestamp),
    metadata: { source: "test", seats: 3 },
    createdAt: new Date(timestamp),
    updatedAt: new Date(laterTimestamp),
  });
  assert.deepEqual(prismaSubscriptionMapper.toDomain(persisted), subscription);
});

test("preserves absent optional subscription fields", () => {
  const restored = prismaSubscriptionMapper.toDomain({
    id: "sub_1",
    organizationId: "org_1",
    planId: "plan_1",
    status: "pending",
    provider: "asaas",
    providerConnectionId: "connection_1",
    providerCustomerId: null,
    providerSubscriptionId: null,
    currentPeriodStart: null,
    currentPeriodEnd: undefined,
    metadata: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  assert.equal(restored.providerCustomerId, undefined);
  assert.equal(restored.providerSubscriptionId, undefined);
  assert.equal(restored.currentPeriodStart, undefined);
  assert.equal(restored.currentPeriodEnd, undefined);
  assert.equal(restored.metadata, undefined);
  assert.throws(
    () =>
      prismaSubscriptionMapper.toDomain({
        ...prismaSubscriptionMapper.toPersistence(makeSubscription()),
        id: "",
      }),
    /subscription\.id/,
  );
});
