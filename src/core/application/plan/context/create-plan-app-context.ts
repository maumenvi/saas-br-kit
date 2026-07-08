import type { AppContext } from "../../../context/app-context.ts";
import type {
  AuditEventRepositoryPort,
  BillingEventRepositoryPort,
  PlanRepositoryPort,
} from "../../../ports/index.ts";

export type CreatePlanAppContext = AppContext &
  Readonly<{
    repositories: Readonly<{
      plans: PlanRepositoryPort;
      billingEvents: BillingEventRepositoryPort;
      auditEvents: AuditEventRepositoryPort;
    }>;
  }>;
