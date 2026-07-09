import assert from "node:assert/strict";
import test from "node:test";
import {
  AsaasWebhookMapper,
  asaasWebhookMapper,
} from "../../../../src/adapters/payment-asaas/mappers/webhook-mapper.ts";

test("maps payment subscription data and optional fields", () => {
  const result = asaasWebhookMapper.toParsedEvent({
    event: "PAYMENT_RECEIVED",
    payment: {
      customer: "cus_1",
      dateCreated: "2026-06-28T10:00:00.000Z",
      status: "RECEIVED",
      subscription: { id: "sub_1" },
    },
  });

  assert.deepEqual(result, {
    kind: "subscription_status_changed",
    providerSubscriptionId: "sub_1",
    providerCustomerId: "cus_1",
    occurredAt: "2026-06-28T10:00:00.000Z",
    status: "active",
  });
});

test("accepts JSON strings and maps subscription-level data", () => {
  const mapper = new AsaasWebhookMapper();
  const result = mapper.toParsedEvent(
    JSON.stringify({
      event: "SUBSCRIPTION_UPDATED",
      subscription: { id: "sub_2", status: "INACTIVE" },
    }),
  );

  assert.deepEqual(result, {
    kind: "subscription_status_changed",
    providerSubscriptionId: "sub_2",
    status: "paused",
  });
});

test("maps provider status precedence", () => {
  const cases = [
    [{ event: "SUBSCRIPTION_DELETED", subscription: { id: "1", status: "ACTIVE" } }, "canceled"],
    [{ payment: { subscription: { id: "1" }, status: "CONFIRMED" } }, "active"],
    [{ payment: { subscription: { id: "1" }, status: "OVERDUE" } }, "past_due"],
    [{ subscription: { id: "1", status: "ACTIVE" } }, "active"],
    [{ subscription: { id: "1", status: "UNKNOWN" } }, "pending"],
  ] as const;

  for (const [payload, expected] of cases) {
    const result = asaasWebhookMapper.toParsedEvent(payload);
    assert.equal(result.kind, "subscription_status_changed");
    assert.equal(result.status, expected);
  }
});

test("returns an unknown event when the subscription id is missing or empty", () => {
  for (const payload of [{ event: "PAYMENT_CREATED" }, { subscription: { id: "" } }]) {
    assert.deepEqual(asaasWebhookMapper.toParsedEvent(payload), {
      kind: "unknown",
      reason: "asaas.subscription_id_missing",
    });
  }
});
