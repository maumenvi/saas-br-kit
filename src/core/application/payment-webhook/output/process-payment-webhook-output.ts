import type { BillingEvent, Subscription, WebhookEvent } from "../../../domain/index.ts";

export type ProcessPaymentWebhookOutput = Readonly<{
  outcome: "processed" | "already_processed" | "unknown";
  event: WebhookEvent;
  subscription?: Subscription;
  billingEvent?: BillingEvent;
}>;
