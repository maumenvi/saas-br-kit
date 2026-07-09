import assert from "node:assert/strict";
import test from "node:test";
import type { VerifyBillingWebhookInput } from "#core";
import {
  AsaasWebhookVerifier,
  createAsaasWebhookVerifier,
} from "../../../../src/adapters/payment-asaas/webhook/asaas-webhook-verifier.ts";

test("reports unsupported verification when no token is configured", async () => {
  const verifier = createAsaasWebhookVerifier();

  assert.equal(verifier instanceof AsaasWebhookVerifier, true);
  assert.deepEqual(await verifier.verify(input()), {
    ok: true,
    data: { status: "unsupported" },
  });
});

test("accepts either Asaas token header case-insensitively", async () => {
  const verifier = createAsaasWebhookVerifier({ webhookToken: "expected" });

  for (const headers of [
    { "Asaas-Webhook-Token": "expected" },
    { "X-ASAAS-WEBHOOK-TOKEN": ["expected", "ignored"] },
  ]) {
    assert.deepEqual(await verifier.verify(input(headers)), {
      ok: true,
      data: { status: "verified" },
    });
  }
});

test("rejects missing and invalid tokens", async () => {
  const verifier = createAsaasWebhookVerifier({ webhookToken: "expected" });

  for (const headers of [undefined, { "asaas-webhook-token": "invalid" }]) {
    assert.deepEqual(await verifier.verify(input(headers)), {
      ok: false,
      error: {
        kind: "authorization",
        code: "asaas.webhook_token_invalid",
        message: "Asaas webhook token is invalid.",
      },
    });
  }
});

function input(
  headers?: Readonly<Record<string, string | readonly string[]>>,
): VerifyBillingWebhookInput {
  return { ...(headers === undefined ? {} : { headers }) } as VerifyBillingWebhookInput;
}
