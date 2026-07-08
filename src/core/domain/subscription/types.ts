import type { OrganizationId, PlanId, SubscriptionId } from "../index.ts";
import type { SafeMetadata } from "../metadata/index.ts";
import type { TimestampInput } from "../validation/index.ts";
import type { SubscriptionStatus } from "./status.ts";

export type SubscriptionProps = Readonly<{
  id: SubscriptionId;
  organizationId: OrganizationId;
  userId?: string;
  customerId?: string;
  planId: PlanId;
  status: SubscriptionStatus;
  provider: string;
  providerConnectionId: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: SafeMetadata;
}>;

export type CreateSubscriptionEntityInput = Readonly<{
  id: SubscriptionId;
  organizationId: OrganizationId;
  userId?: string;
  customerId?: string;
  planId: PlanId;
  status?: SubscriptionStatus;
  provider: string;
  providerConnectionId: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  currentPeriodStart?: TimestampInput;
  currentPeriodEnd?: TimestampInput;
  createdAt: TimestampInput;
  updatedAt?: TimestampInput;
  metadata?: SafeMetadata;
}>;

export type ApplyProviderSubscriptionInput = Readonly<{
  providerCustomerId: string;
  providerSubscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodStart?: TimestampInput;
  currentPeriodEnd?: TimestampInput;
  updatedAt: TimestampInput;
}>;

export type MarkSubscriptionProviderFailureInput = Readonly<{
  updatedAt: TimestampInput;
}>;

export type ApplyWebhookSubscriptionStatusInput = Readonly<{
  status: SubscriptionStatus;
  updatedAt: TimestampInput;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  currentPeriodStart?: TimestampInput;
  currentPeriodEnd?: TimestampInput;
}>;

export type SubscriptionAccessDecision = Readonly<{
  allowed: boolean;
  reason:
    | "subscription_active"
    | "subscription_missing"
    | "subscription_not_started"
    | "subscription_expired"
    | "subscription_inactive";
  subscriptionId?: SubscriptionId;
  status?: SubscriptionStatus;
}>;
