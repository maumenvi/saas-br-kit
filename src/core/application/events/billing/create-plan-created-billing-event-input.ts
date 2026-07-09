import type { Plan } from "../../../domain/index.ts";

export type CreatePlanCreatedBillingEventInput = Readonly<{
  id: string;
  occurredAt: string;
  plan: Plan;
}>;
