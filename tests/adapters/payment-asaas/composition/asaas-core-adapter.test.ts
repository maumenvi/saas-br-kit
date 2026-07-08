import assert from "node:assert/strict";
import test from "node:test";
import { clock, idGenerator, logger, SaasBrCore, transactionManager } from "#core";
import { asaasCoreAdapter } from "../../../../src/adapters/payment-asaas/composition/asaas-core-adapter.ts";
import { createFakeAsaasClient } from "../../../../src/adapters/payment-asaas/testing/index.ts";
import {
  createFixedClock,
  createNoopLogger,
  createPassthroughTransactionManager,
  createSequentialIdGenerator,
} from "../../../../src/testing/index.ts";

test("registers the Asaas payment, selector and webhook ports", async () => {
  const application = await SaasBrCore.create()
    .add(clock(createFixedClock(new Date("2026-06-18T00:00:00.000Z"))))
    .add(logger(createNoopLogger()))
    .add(idGenerator(createSequentialIdGenerator("asaas")))
    .add(transactionManager(createPassthroughTransactionManager({ idPrefix: "asaas_tx" })))
    .adapters.add(asaasCoreAdapter({ client: createFakeAsaasClient(), webhookToken: "secret" }))
    .build();

  const output = application.outputs.asaas;
  assert.deepEqual(application.appContext.adapters.payments, [output.payment]);
  assert.equal(application.appContext.paymentProviderSelector, output.paymentProviderSelector);
  assert.equal(application.appContext.paymentWebhookVerifier, output.paymentWebhookVerifier);
  assert.equal(application.appContext.paymentWebhookParser, output.paymentWebhookParser);
});
