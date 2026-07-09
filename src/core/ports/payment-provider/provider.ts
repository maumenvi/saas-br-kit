import type { ExecutionContext } from "../../context/execution-context.ts";
import type { Organization, Plan, Subscription, SubscriptionStatus } from "../../domain/index.ts";
import type { CoreError, Result } from "../../errors/result.ts";
import type { BillingProviderConnection } from "./connection.ts";
import type { SubscriptionCustomerInput } from "./customer.ts";

export type BillingProviderCapability = "subscription";

export type CreateProviderSubscriptionInput = Readonly<{
  executionContext: ExecutionContext;
  connection: BillingProviderConnection;
  organization: Organization;
  plan: Plan;
  subscription: Subscription;
  customer: SubscriptionCustomerInput;
  requestedAt: string;
}>;

export type CreateProviderSubscriptionOutput = Readonly<{
  providerCustomerId: string;
  providerSubscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
}>;

export type CancelProviderSubscriptionInput = Readonly<{
  executionContext: ExecutionContext;
  connection: BillingProviderConnection;
  subscription: Subscription;
  requestedAt: string;
}>;

export type BillingProviderPort = Readonly<{
  provider: string;
  capabilities: readonly BillingProviderCapability[];
  createCustomerAndSubscription(
    input: CreateProviderSubscriptionInput,
  ): Promise<Result<CreateProviderSubscriptionOutput, CoreError>>;
  cancelSubscription(input: CancelProviderSubscriptionInput): Promise<Result<void, CoreError>>;
}>;
