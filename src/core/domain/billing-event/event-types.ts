export const BILLING_EVENT_TYPES = [
  "plan_created",
  "subscription_created",
  "subscription_provider_failed",
  "subscription_webhook_applied",
  "subscription_access_denied",
] as const;

export type BillingEventType = (typeof BILLING_EVENT_TYPES)[number];
