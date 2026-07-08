import assert from "node:assert/strict";
import test from "node:test";
import {
  asaasCoreAdapter,
  SingleAsaasProviderSelector,
} from "../../../../src/adapters/payment-asaas/composition/index.ts";

test("exports the Asaas Core composition surface", () => {
  assert.equal(typeof asaasCoreAdapter, "function");
  assert.equal(typeof SingleAsaasProviderSelector, "function");
});
