import type { AppContext } from "../../../context/app-context.ts";
import type {
  AuditEventRepositoryPort,
  BillingEventRepositoryPort,
  BillingProviderSelectorPort,
  CustomerRepositoryPort,
  OrganizationRepositoryPort,
  PlanRepositoryPort,
  SubscriptionRepositoryPort,
} from "../../../ports/index.ts";

export type SubscriptionAppContext = AppContext &
  Readonly<{
    paymentProviderSelector: BillingProviderSelectorPort;
    repositories: Readonly<{
      organizations: OrganizationRepositoryPort;
      plans: PlanRepositoryPort;
      subscriptions: SubscriptionRepositoryPort;
      billingEvents: BillingEventRepositoryPort;
      auditEvents: AuditEventRepositoryPort;
      customers: CustomerRepositoryPort;
    }>;
  }>;
