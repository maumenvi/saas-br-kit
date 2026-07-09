import assert from "node:assert/strict";
import test from "node:test";
import type { CreateProviderSubscriptionInput } from "#core";
import type {
  AsaasCustomerInput,
  AsaasSubscriptionInput,
} from "../../../../src/adapters/payment-asaas/client/types.ts";
import {
  AsaasBillingProvider,
  createAsaasBillingProvider,
} from "../../../../src/adapters/payment-asaas/provider/asaas-billing-provider.ts";
import { createFakeAsaasClient } from "../../../../src/adapters/payment-asaas/testing/fake-asaas-client.ts";

test("creates an Asaas customer and subscription from Core data", async () => {
  const client = createFakeAsaasClient();
  const provider = createAsaasBillingProvider({ client, billingType: "BOLETO" });

  const result = await provider.createCustomerAndSubscription(providerInput());

  assert.equal(provider instanceof AsaasBillingProvider, true);
  assert.equal(provider.provider, "asaas");
  assert.deepEqual(provider.capabilities, ["subscription"]);
  assert.deepEqual(client.customers, [
    { id: "cus_1", name: "Ada", email: "ada@example.com", cpfCnpj: "12345678900" },
  ]);
  assert.deepEqual(client.subscriptions, [
    {
      id: "sub_1",
      customer: "cus_1",
      status: "ACTIVE",
      value: 49.9,
      cycle: "MONTHLY",
      nextDueDate: "2026-06-28",
    },
  ]);
  assert.deepEqual(result, {
    ok: true,
    data: {
      providerCustomerId: "cus_1",
      providerSubscriptionId: "sub_1",
      status: "active",
    },
  });
});

test("uses custom due dates and omits absent customer fields", async () => {
  const customers: AsaasCustomerInput[] = [];
  const subscriptions: AsaasSubscriptionInput[] = [];
  const provider = createAsaasBillingProvider({
    client: {
      async createCustomer(input) {
        customers.push(input);
        return { id: "cus_1" };
      },
      async createSubscription(input) {
        subscriptions.push(input);
        return { id: "sub_1", customer: input.customer };
      },
    },
    nextDueDate: () => "2026-07-15",
  });

  const result = await provider.createCustomerAndSubscription(
    providerInput({ customer: { name: "Ada" } }),
  );

  assert.deepEqual(customers, [{ name: "Ada", externalReference: "org_1" }]);
  assert.deepEqual(subscriptions, [
    {
      customer: "cus_1",
      billingType: "PIX",
      value: 49.9,
      nextDueDate: "2026-07-15",
      cycle: "MONTHLY",
      description: "Starter",
      externalReference: "subscription_1",
    },
  ]);
  assert.equal(result.ok, true);
});

test("maps client failures to Core errors", async () => {
  const provider = createAsaasBillingProvider({
    client: {
      async createCustomer() {
        throw { status: 503, token: "must-not-leak" };
      },
      async createSubscription() {
        throw new Error("unreachable");
      },
    },
  });

  const result = await provider.createCustomerAndSubscription(providerInput());

  assert.deepEqual(result, {
    ok: false,
    error: {
      kind: "external",
      code: "asaas.request_failed",
      message: "Asaas request failed.",
      details: { provider: "asaas", status: 503 },
      retryable: true,
    },
  });
});

test("cancels a provider subscription through the client", async () => {
  const canceledIds: string[] = [];
  const provider = createAsaasBillingProvider({
    client: {
      createCustomer: async () => ({ id: "unused" }),
      createSubscription: async () => ({ id: "unused", customer: "unused" }),
      cancelSubscription: async (subscriptionId) => {
        canceledIds.push(subscriptionId);
      },
    },
  });

  const result = await provider.cancelSubscription({
    subscription: { providerSubscriptionId: "asaas_sub_1" },
  } as never);

  assert.deepEqual(result, { ok: true, data: undefined });
  assert.deepEqual(canceledIds, ["asaas_sub_1"]);
});

test("rejects cancellation when provider id or client capability is absent", async () => {
  const provider = createAsaasBillingProvider({
    client: {
      createCustomer: async () => ({ id: "unused" }),
      createSubscription: async () => ({ id: "unused", customer: "unused" }),
    },
  });

  const missingId = await provider.cancelSubscription({ subscription: {} } as never);
  const unsupported = await provider.cancelSubscription({
    subscription: { providerSubscriptionId: "asaas_sub_1" },
  } as never);

  assert.equal(missingId.ok, false);
  assert.equal(missingId.error.code, "asaas.subscription_cancel_unsupported");
  assert.equal(unsupported.ok, false);
  assert.equal(unsupported.error.code, "asaas.subscription_cancel_unsupported");
});

test("maps cancellation client failures to Core errors", async () => {
  const provider = createAsaasBillingProvider({
    client: {
      createCustomer: async () => ({ id: "unused" }),
      createSubscription: async () => ({ id: "unused", customer: "unused" }),
      cancelSubscription: async () => {
        throw { status: 503 };
      },
    },
  });

  const result = await provider.cancelSubscription({
    subscription: { providerSubscriptionId: "asaas_sub_1" },
  } as never);

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "asaas.request_failed");
  assert.equal(result.error.retryable, true);
});

function providerInput(
  overrides: Partial<CreateProviderSubscriptionInput> = {},
): CreateProviderSubscriptionInput {
  return {
    organization: { id: "org_1" },
    plan: {
      name: "Starter",
      price: { amountCents: 4990, currency: "BRL", interval: "monthly" },
    },
    subscription: { id: "subscription_1" },
    customer: {
      name: "Ada",
      email: "ada@example.com",
      document: "12345678900",
    },
    requestedAt: "2026-06-28T12:00:00.000Z",
    ...overrides,
  } as CreateProviderSubscriptionInput;
}
