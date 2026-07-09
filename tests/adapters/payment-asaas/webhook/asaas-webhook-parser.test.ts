import assert from "node:assert/strict";
import test from "node:test";
import type { ParseBillingWebhookInput } from "#core";
import {
  AsaasWebhookParser,
  createAsaasWebhookParser,
} from "../../../../src/adapters/payment-asaas/webhook/asaas-webhook-parser.ts";

test("parses valid webhook payloads", async () => {
  const parser = createAsaasWebhookParser();

  const result = await parser.parse(
    input({
      event: "PAYMENT_OVERDUE",
      payment: {
        status: "OVERDUE",
        subscription: { id: "sub_1" },
      },
    }),
  );

  assert.equal(parser instanceof AsaasWebhookParser, true);
  assert.deepEqual(result, {
    ok: true,
    data: {
      kind: "subscription_status_changed",
      providerSubscriptionId: "sub_1",
      status: "past_due",
    },
  });
});

test("returns a validation error for malformed JSON", async () => {
  const result = await createAsaasWebhookParser().parse(input("{invalid"));

  assert.deepEqual(result, {
    ok: false,
    error: {
      kind: "validation",
      code: "asaas.webhook_payload_invalid",
      message: "Asaas webhook payload could not be parsed.",
    },
  });
});

function input(rawPayload: string | Readonly<Record<string, unknown>>): ParseBillingWebhookInput {
  return { event: { rawPayload } } as ParseBillingWebhookInput;
}
