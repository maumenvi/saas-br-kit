import assert from "node:assert/strict";
import test from "node:test";
import { asaasPaymentAdapter } from "../../../src/adapters/payment-asaas/asaas-payment-adapter.ts";
import type { AsaasClient } from "../../../src/adapters/payment-asaas/client/types.ts";

test("creates the Asaas adapter with its descriptor and client", () => {
  const client = createClient();
  const adapter = asaasPaymentAdapter(client);

  assert.equal(adapter.name, "asaas");
  assert.equal(adapter.client, client);
  assert.deepEqual(adapter.descriptor, {
    provider: "asaas",
    capabilities: ["subscription", "pix", "boleto", "webhook-verification"],
  });
});

test("delegates health checks to the client when available", async () => {
  let calls = 0;
  const client = createClient(async () => {
    calls += 1;
  });

  const healthCheck = asaasPaymentAdapter(client).healthCheck;
  assert.ok(healthCheck);
  const result = await healthCheck();

  assert.deepEqual(result, { status: "up" });
  assert.equal(calls, 1);
});

test("supports clients without an optional health check", async () => {
  const client = createClient();
  const { healthCheck: _healthCheck, ...clientWithoutHealthCheck } = client;
  const healthCheck = asaasPaymentAdapter(clientWithoutHealthCheck).healthCheck;
  assert.ok(healthCheck);

  assert.deepEqual(await healthCheck(), {
    status: "up",
  });
});

function createClient(healthCheck?: () => Promise<void>): AsaasClient {
  return {
    async createCustomer(input) {
      return { id: "cus_1", name: input.name };
    },
    async createSubscription(input) {
      return { id: "sub_1", customer: input.customer };
    },
    ...(healthCheck === undefined ? {} : { healthCheck }),
  };
}
