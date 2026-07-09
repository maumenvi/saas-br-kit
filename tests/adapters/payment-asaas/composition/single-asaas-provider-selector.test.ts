import assert from "node:assert/strict";
import test from "node:test";
import { SingleAsaasProviderSelector } from "../../../../src/adapters/payment-asaas/composition/single-asaas-provider-selector.ts";
import { createAsaasBillingProvider } from "../../../../src/adapters/payment-asaas/provider/index.ts";
import { createFakeAsaasClient } from "../../../../src/adapters/payment-asaas/testing/index.ts";

test("selects the configured Asaas provider and rejects another provider", async () => {
  const selector = new SingleAsaasProviderSelector(
    createAsaasBillingProvider({ client: createFakeAsaasClient() }),
  );

  const selected = await selector.selectProvider({
    organizationId: "org_1",
    capability: "subscription",
  });
  assert.equal(selected.ok, true);
  if (selected.ok) assert.equal(selected.data.connection.provider, "asaas");

  const unavailable = await selector.selectProvider({
    organizationId: "org_1",
    capability: "subscription",
    requestedProvider: "other",
  });
  assert.equal(unavailable.ok, false);
});
