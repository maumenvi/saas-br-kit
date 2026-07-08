import type { AuditEvent, BillingEvent, Subscription } from "../../../domain/index.ts";

export type CreateSubscriptionOutput = Readonly<{
  subscription: Subscription;
  billingEvent: BillingEvent;
  auditEvent: AuditEvent;
}>;
