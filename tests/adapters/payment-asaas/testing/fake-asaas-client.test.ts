import assert from "node:assert/strict";
import test from "node:test";
import {
  createFakeAsaasClient,
  FakeAsaasClient,
} from "../../../../src/adapters/payment-asaas/testing/fake-asaas-client.ts";

test("stores customers with generated ids and optional fields", async () => {
  const client = createFakeAsaasClient();

  const first = await client.createCustomer({
    name: "Ada",
    email: "ada@example.com",
    cpfCnpj: "123",
  });
  const second = await client.createCustomer({ name: "Grace" });

  assert.equal(client instanceof FakeAsaasClient, true);
  assert.deepEqual(first, {
    id: "cus_1",
    name: "Ada",
    email: "ada@example.com",
    cpfCnpj: "123",
  });
  assert.deepEqual(second, { id: "cus_2", name: "Grace" });
  assert.deepEqual(client.customers, [first, second]);
});

test("stores active subscriptions with generated ids", async () => {
  const client = createFakeAsaasClient();

  const subscription = await client.createSubscription({
    customer: "cus_1",
    billingType: "PIX",
    value: 49.9,
    nextDueDate: "2026-07-01",
    cycle: "MONTHLY",
  });

  assert.deepEqual(subscription, {
    id: "sub_1",
    customer: "cus_1",
    status: "ACTIVE",
    value: 49.9,
    cycle: "MONTHLY",
    nextDueDate: "2026-07-01",
  });
  assert.deepEqual(client.subscriptions, [subscription]);
  assert.equal(await client.healthCheck(), undefined);
});

test("cancels existing subscriptions without removing them", async () => {
  const client = createFakeAsaasClient();
  const subscription = await client.createSubscription({
    customer: "cus_1",
    billingType: "PIX",
    value: 49.9,
    nextDueDate: "2026-07-01",
    cycle: "MONTHLY",
  });

  await client.cancelSubscription(subscription.id);

  assert.equal(client.subscriptions.length, 1);
  assert.equal(client.subscriptions[0]?.status, "INACTIVE");
  await assert.rejects(client.cancelSubscription("missing"), /was not found/);
});
