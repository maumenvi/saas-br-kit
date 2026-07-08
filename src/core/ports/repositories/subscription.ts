import type { OrganizationId, Subscription } from "../../domain/index.ts";
import type { RepositoryOperationOptions } from "./options.ts";

export type SubscriptionRepositoryPort = Readonly<{
  save(subscription: Subscription, options?: RepositoryOperationOptions): Promise<void>;
  findById(
    subscriptionId: string,
    options?: RepositoryOperationOptions,
  ): Promise<Subscription | null>;
  findCurrentByOrganizationId(
    organizationId: OrganizationId,
    options?: RepositoryOperationOptions,
  ): Promise<Subscription | null>;
  listByOrganizationId(
    organizationId: OrganizationId,
    options?: RepositoryOperationOptions,
  ): Promise<readonly Subscription[]>;
}>;

export type FindSubscriptionByProviderSubscriptionIdInput = Readonly<{
  provider: string;
  providerSubscriptionId: string;
  organizationId?: OrganizationId;
  providerConnectionId?: string;
}>;

export type SubscriptionWebhookRepositoryPort = Readonly<{
  save(subscription: Subscription, options?: RepositoryOperationOptions): Promise<void>;
  findByProviderSubscriptionId(
    input: FindSubscriptionByProviderSubscriptionIdInput,
    options?: RepositoryOperationOptions,
  ): Promise<Subscription | null>;
}>;
