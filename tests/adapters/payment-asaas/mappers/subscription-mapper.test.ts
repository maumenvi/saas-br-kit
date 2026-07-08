import assert from "node:assert/strict";
import test from "node:test";
import type { Plan } from "#core";
import {
  AsaasSubscriptionMapper,
  asaasSubscriptionMapper,
} from "../../../../src/adapters/payment-asaas/mappers/subscription-mapper.ts";

test("maps plan prices, intervals, and billing type defaults", () => {
  const monthlyPlan = plan(4990, "monthly");
  const yearlyPlan = plan(120_000, "yearly");

  assert.equal(asaasSubscriptionMapper.toValue(monthlyPlan), 49.9);
  assert.equal(asaasSubscriptionMapper.toCycle(monthlyPlan), "MONTHLY");
  assert.equal(asaasSubscriptionMapper.toCycle(yearlyPlan), "YEARLY");
  assert.equal(asaasSubscriptionMapper.toBillingType(), "PIX");
  assert.equal(asaasSubscriptionMapper.toBillingType("BOLETO"), "BOLETO");
});

test("maps every known subscription status and defaults unknown statuses", () => {
  const mapper = new AsaasSubscriptionMapper();
  const cases = [
    ["ACTIVE", "active"],
    ["OVERDUE", "past_due"],
    ["INACTIVE", "paused"],
    ["DELETED", "canceled"],
    ["EXPIRED", "expired"],
    ["PENDING", "pending"],
    [undefined, "pending"],
  ] as const;

  for (const [status, expected] of cases) {
    const subscription = {
      id: "sub_1",
      customer: "cus_1",
      ...(status === undefined ? {} : { status }),
    };
    assert.equal(mapper.toSubscriptionStatus(subscription), expected);
  }
});

function plan(amountCents: number, interval: "monthly" | "yearly"): Plan {
  return {
    price: { amountCents, currency: "BRL", interval },
  } as Plan;
}
