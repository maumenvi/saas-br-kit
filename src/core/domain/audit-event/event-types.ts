export const AUDIT_EVENT_TYPES = [
  "billing.plan_created",
  "billing.subscription_created",
  "billing.subscription_provider_failed",
  "billing.subscription_access_denied",
] as const;

export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];

export type AuditEventActorType = "system" | "user" | "service";
