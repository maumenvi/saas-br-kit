import assert from "node:assert/strict";
import test from "node:test";
import { coreProperties, SaasBrCore } from "#core";
import { createPassthroughTransactionManager } from "#testing";
import { asaasCoreAdapter } from "../../../../src/adapters/payment-asaas/composition/asaas-core-adapter.ts";
import { createFakeAsaasClient } from "../../../../src/adapters/payment-asaas/testing/index.ts";

test("registers the Asaas payment, selector and webhook ports", async () => {
  const application = await SaasBrCore.create()
    .add(coreProperties({ transactionManager: createPassthroughTransactionManager() }))
    .add(asaasCoreAdapter({ client: createFakeAsaasClient(), webhookToken: "secret" }))
    .build();

  const output = application.outputs.asaas;
  assert.deepEqual(application.appContext.adapters.payments, [output.payment]);
  assert.equal(application.appContext.paymentProviderSelector, output.paymentProviderSelector);
  assert.equal(application.appContext.paymentWebhookVerifier, output.paymentWebhookVerifier);
  assert.equal(application.appContext.paymentWebhookParser, output.paymentWebhookParser);
});
