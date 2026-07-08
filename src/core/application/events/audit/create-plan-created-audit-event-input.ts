import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { Plan } from "../../../domain/index.ts";

export type CreatePlanCreatedAuditEventInput = Readonly<{
  id: string;
  occurredAt: string;
  executionContext: ExecutionContext;
  plan: Plan;
}>;
