import assert from "node:assert/strict";
import test from "node:test";
import { prismaBillingEventMapper } from "../../../../src/adapters/database-prisma/mappers/billing-event-mapper.ts";
import { makeBillingEvent, timestamp } from "../support.ts";

test("maps billing events to persistence and back", () => {
  const event = makeBillingEvent();
  const persisted = prismaBillingEventMapper.toPersistence(event);

  assert.deepEqual(persisted, {
    id: "billing_event_1",
    type: "subscription_created",
    occurredAt: new Date(timestamp),
    organizationId: "org_1",
    planId: "plan_1",
    subscriptionId: "sub_1",
    metadata: { source: "test" },
  });
  assert.deepEqual(prismaBillingEventMapper.toDomain(persisted), event);
});

test("excludes invalid optional billing event values", () => {
  const restored = prismaBillingEventMapper.toDomain({
    id: "billing_event_1",
    type: "plan_created",
    occurredAt: timestamp,
    organizationId: null,
    planId: 1,
    subscriptionId: false,
    metadata: [],
  });

  assert.equal(restored.organizationId, undefined);
  assert.equal(restored.planId, undefined);
  assert.equal(restored.subscriptionId, undefined);
  assert.equal(restored.metadata, undefined);
  assert.equal(prismaBillingEventMapper.toPersistence(restored).metadata, undefined);
  assert.throws(
    () =>
      prismaBillingEventMapper.toDomain({
        ...prismaBillingEventMapper.toPersistence(makeBillingEvent()),
        id: "",
      }),
    /billingEvent\.id/,
  );
});
