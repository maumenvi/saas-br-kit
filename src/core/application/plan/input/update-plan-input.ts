import type { PlanBillingInterval, SafeMetadata } from "../../../domain/index.ts";

export type UpdatePlanInput = Readonly<{
  organizationId: string;
  planId: string;
  name?: string;
  amountCents?: number;
  interval?: PlanBillingInterval;
  features?: readonly string[];
  metadata?: SafeMetadata | null;
}>;
