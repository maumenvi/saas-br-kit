import type { OrganizationId, PlanId } from "../index.ts";
import type { SafeMetadata } from "../metadata/index.ts";
import type { TimestampInput } from "../validation/index.ts";
import type { PlanBillingInterval, PlanCurrency, PlanStatus } from "./constants.ts";

export type PlanPrice = Readonly<{
  amountCents: number;
  currency: PlanCurrency;
  interval: PlanBillingInterval;
}>;

export type PlanProps = Readonly<{
  id: PlanId;
  organizationId: OrganizationId;
  code: string;
  name: string;
  price: PlanPrice;
  features: readonly string[];
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
  metadata?: SafeMetadata;
}>;

export type CreatePlanEntityInput = Readonly<{
  id: PlanId;
  organizationId: OrganizationId;
  code: string;
  name: string;
  amountCents: number;
  currency?: PlanCurrency;
  interval: PlanBillingInterval;
  features?: readonly string[];
  status?: PlanStatus;
  createdAt: TimestampInput;
  updatedAt?: TimestampInput;
  metadata?: SafeMetadata;
}>;
