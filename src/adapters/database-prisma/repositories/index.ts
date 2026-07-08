import type { DatabaseAdapter } from "#adapters/database";
import type {
  AuditEventRepositoryPort,
  BillingEventRepositoryPort,
  CustomerRepositoryPort,
  FederatedIdentityRepositoryPort,
  MembershipRepositoryPort,
  OrganizationRepositoryPort,
  PlanRepositoryPort,
  SubscriptionRepositoryPort,
  SubscriptionWebhookRepositoryPort,
  UserCredentialsRepositoryPort,
  UserRepositoryPort,
  WebhookEventRepositoryPort,
} from "#core";
import type { PrismaDatabaseClient, PrismaTransactionClient } from "../prisma-types.ts";
import { PrismaAuditEventRepository } from "./audit-event-repository.ts";
import { PrismaBillingEventRepository } from "./billing-event-repository.ts";
import { PrismaRepositoryContext } from "./context.ts";
import { PrismaCustomerRepository } from "./customer-repository.ts";
import { PrismaFederatedIdentityRepository } from "./federated-identity-repository.ts";
import { PrismaMembershipRepository } from "./membership-repository.ts";
import { PrismaOrganizationRepository } from "./organization-repository.ts";
import { PrismaPasswordResetTokenRepository } from "./password-reset-token-repository.ts";
import { PrismaPlanRepository } from "./plan-repository.ts";
import { PrismaSubscriptionRepository } from "./subscription-repository.ts";
import { PrismaUserCredentialsRepository, PrismaUserRepository } from "./user-repository.ts";
import { PrismaWebhookEventRepository } from "./webhook-event-repository.ts";

type PasswordResetTokenStorePort = Readonly<{
  save(
    record: Readonly<Record<string, unknown>>,
    options?: Readonly<Record<string, unknown>>,
  ): Promise<void>;
  findBySecretHash(
    secretHash: string,
    options?: Readonly<Record<string, unknown>>,
  ): Promise<Readonly<Record<string, unknown>> | null>;
}>;

export type PrismaBillingRepositories = Readonly<{
  organizations: OrganizationRepositoryPort;
  plans: PlanRepositoryPort;
  subscriptions: SubscriptionRepositoryPort & SubscriptionWebhookRepositoryPort;
  billingEvents: BillingEventRepositoryPort;
  auditEvents: AuditEventRepositoryPort;
  webhookEvents: WebhookEventRepositoryPort;
  users: UserRepositoryPort;
  userCredentials: UserCredentialsRepositoryPort;
  passwordResetTokens: PasswordResetTokenStorePort;
  customers: CustomerRepositoryPort;
  memberships: MembershipRepositoryPort;
  federatedIdentities: FederatedIdentityRepositoryPort;
}>;

/** Creates repository adapters for the v1 billing and webhook persistence slice. */
export function createPrismaBillingRepositories(
  database: DatabaseAdapter<PrismaDatabaseClient, PrismaTransactionClient>,
): PrismaBillingRepositories {
  const context = new PrismaRepositoryContext(database);
  return Object.freeze({
    organizations: new PrismaOrganizationRepository(context),
    plans: new PrismaPlanRepository(context),
    subscriptions: new PrismaSubscriptionRepository(context),
    billingEvents: new PrismaBillingEventRepository(context),
    auditEvents: new PrismaAuditEventRepository(context),
    webhookEvents: new PrismaWebhookEventRepository(context),
    users: new PrismaUserRepository(context),
    userCredentials: new PrismaUserCredentialsRepository(context),
    passwordResetTokens: new PrismaPasswordResetTokenRepository(context),
    customers: new PrismaCustomerRepository(context),
    memberships: new PrismaMembershipRepository(context),
    federatedIdentities: new PrismaFederatedIdentityRepository(context),
  });
}

export * from "./audit-event-repository.ts";
export * from "./billing-event-repository.ts";
export * from "./context.ts";
export * from "./customer-repository.ts";
export * from "./federated-identity-repository.ts";
export * from "./membership-repository.ts";
export * from "./organization-repository.ts";
export * from "./password-reset-token-repository.ts";
export * from "./plan-repository.ts";
export * from "./subscription-repository.ts";
export * from "./user-repository.ts";
export * from "./webhook-event-repository.ts";
