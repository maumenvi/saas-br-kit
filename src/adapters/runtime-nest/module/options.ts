import type {
  AppContext,
  AuditEventRepositoryPort,
  AuthAppContext,
  BillingEventRepositoryPort,
  BillingProviderSelectorPort,
  BillingWebhookParserPort,
  BillingWebhookVerifierPort,
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
import type { OidcProviderPort, OidcTransactionStorePort } from "../oidc/types.ts";

export type SaasBrNestRepositories = Readonly<{
  organizations: OrganizationRepositoryPort;
  plans: PlanRepositoryPort;
  subscriptions: SubscriptionRepositoryPort & SubscriptionWebhookRepositoryPort;
  billingEvents: BillingEventRepositoryPort;
  auditEvents: AuditEventRepositoryPort;
  webhookEvents: WebhookEventRepositoryPort;
  customers: CustomerRepositoryPort;
  memberships: MembershipRepositoryPort;
  users: UserRepositoryPort;
  userCredentials: UserCredentialsRepositoryPort;
  passwordResetTokens: Readonly<{
    save(
      record: Readonly<Record<string, unknown>>,
      options?: Readonly<Record<string, unknown>>,
    ): Promise<void>;
    findBySecretHash(
      secretHash: string,
      options?: Readonly<Record<string, unknown>>,
    ): Promise<Readonly<Record<string, unknown>> | null>;
  }>;
}>;

export type SaasBrNestAppContext = AppContext &
  AuthAppContext &
  Readonly<{
    auth: AuthAppContext["auth"] &
      Readonly<{
        federatedIdentities?: FederatedIdentityRepositoryPort;
      }>;
    repositories: SaasBrNestRepositories;
    paymentProviderSelector: BillingProviderSelectorPort;
    paymentWebhookVerifier: BillingWebhookVerifierPort;
    paymentWebhookParser: BillingWebhookParserPort;
  }>;

export type SaasBrNestOptions = Readonly<{
  appContext: SaasBrNestAppContext;
  invitation?: Readonly<{
    publicBaseUrl?: string;
    tokenSecret?: string;
    tokenTtlMs?: number;
  }>;
  oidc?: Readonly<{
    providers: readonly OidcProviderPort[];
    publicBaseUrl?: string;
    transactionStore?: OidcTransactionStorePort;
    transactionTtlMs?: number;
  }>;
}>;

export type SaasBrNestAsyncOptions = Readonly<{
  imports?: readonly unknown[];
  inject?: readonly unknown[];
  useFactory: (...args: readonly unknown[]) => SaasBrNestOptions | Promise<SaasBrNestOptions>;
}>;
