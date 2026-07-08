export const WEBHOOK_EVENT_STATUSES = [
  "pending",
  "processing",
  "processed",
  "failed",
  "unknown",
] as const;

export type WebhookEventStatus = (typeof WEBHOOK_EVENT_STATUSES)[number];
