import type { Subscription, WebhookEvent } from "../../../domain/index.ts";

export type CreateSubscriptionWebhookAppliedBillingEventInput = Readonly<{
  id: string;
  occurredAt: string;
  subscription: Subscription;
  event: WebhookEvent;
}>;
