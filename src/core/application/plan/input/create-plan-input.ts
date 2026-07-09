import type { PlanBillingInterval, SafeMetadata } from "../../../domain/index.ts";

export type CreatePlanInput = Readonly<{
  organizationId: string;
  code: string;
  name: string;
  amountCents: number;
  interval: PlanBillingInterval;
  features?: readonly string[];
  metadata?: SafeMetadata;
}>;
