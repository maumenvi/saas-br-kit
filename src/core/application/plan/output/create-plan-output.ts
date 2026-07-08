import type { AuditEvent, BillingEvent, Plan } from "../../../domain/index.ts";

export type CreatePlanOutput = Readonly<{
  plan: Plan;
  billingEvent: BillingEvent;
  auditEvent: AuditEvent;
}>;
