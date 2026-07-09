import type { WebhookEvent } from "../../../domain/index.ts";
import type { BillingWebhookVerificationStatus } from "../../../ports/index.ts";

export type ReceivePaymentWebhookOutput = Readonly<{
  outcome: "stored" | "duplicate";
  event: WebhookEvent;
  verificationStatus: BillingWebhookVerificationStatus;
}>;
