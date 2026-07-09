import type { BillingEventId, OrganizationId, PlanId, SubscriptionId } from "../index.ts";
import type { SafeMetadata } from "../metadata/index.ts";
import type { TimestampInput } from "../validation/index.ts";
import type { BillingEventType } from "./event-types.ts";

export type BillingEventProps = Readonly<{
  id: BillingEventId;
  type: BillingEventType;
  occurredAt: string;
  organizationId?: OrganizationId;
  planId?: PlanId;
  subscriptionId?: SubscriptionId;
  metadata?: SafeMetadata;
}>;

export type CreateBillingEventEntityInput = Readonly<{
  id: BillingEventId;
  type: BillingEventType;
  occurredAt: TimestampInput;
  organizationId?: OrganizationId;
  planId?: PlanId;
  subscriptionId?: SubscriptionId;
  metadata?: SafeMetadata;
}>;
