import assert from "node:assert/strict";
import test from "node:test";
import { GenericPaymentAdapter } from "#adapters/payment";
import {
  asaasCoreAdapter,
  asaasPaymentAdapter,
  createAsaasApiClient,
  createAsaasBillingProvider,
  createAsaasWebhookParser,
  createAsaasWebhookVerifier,
  createFakeAsaasClient,
} from "../../../src/adapters/payment-asaas/index.ts";

test("exports a working adapter and its public collaborators", async () => {
  const client = createFakeAsaasClient();
  const adapter = asaasPaymentAdapter(client);

  assert.equal(adapter instanceof GenericPaymentAdapter, true);
  assert.equal(adapter.client, client);
  const healthCheck = adapter.healthCheck;
  assert.ok(healthCheck);
  assert.deepEqual(await healthCheck(), { status: "up" });
  assert.equal(typeof createAsaasApiClient, "function");
  assert.equal(typeof createAsaasBillingProvider, "function");
  assert.equal(typeof createAsaasWebhookParser, "function");
  assert.equal(typeof createAsaasWebhookVerifier, "function");
  assert.equal(typeof asaasCoreAdapter, "function");
});
