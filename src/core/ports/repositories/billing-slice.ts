import type { AuditEventRepositoryPort } from "./audit-event.ts";
import type { BillingEventRepositoryPort } from "./billing-event.ts";
import type { OrganizationRepositoryPort } from "./organization.ts";
import type { PlanRepositoryPort } from "./plan.ts";
import type { SubscriptionRepositoryPort } from "./subscription.ts";

export type BillingSliceRepositories = Readonly<{
  organizations: OrganizationRepositoryPort;
  plans: PlanRepositoryPort;
  subscriptions: SubscriptionRepositoryPort;
  billingEvents: BillingEventRepositoryPort;
  auditEvents: AuditEventRepositoryPort;
}>;
