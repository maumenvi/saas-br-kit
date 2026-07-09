import type {
  AuditEventRepositoryPort,
  BillingEventRepositoryPort,
  CustomerRepositoryPort,
  FederatedIdentityRepositoryPort,
  MembershipRepositoryPort,
  OrganizationRepositoryPort,
  PasswordResetTokenStorePort,
  PlanRepositoryPort,
  SubscriptionRepositoryPort,
  SubscriptionWebhookRepositoryPort,
  UserCredentialsRepositoryPort,
  UserRepositoryPort,
  WebhookEventRepositoryPort,
} from "../../ports/index.ts";
import { CorePort } from "../port.ts";

export const organizationRepositoryCorePort = new CorePort<OrganizationRepositoryPort>({
  id: "repository.organization",
  description: "OrganizationRepositoryPort for tenant persistence.",
});

export const planRepositoryCorePort = new CorePort<PlanRepositoryPort>({
  id: "repository.plan",
  description: "PlanRepositoryPort for commercial plan persistence.",
});

export const subscriptionRepositoryCorePort = new CorePort<
  SubscriptionRepositoryPort & SubscriptionWebhookRepositoryPort
>({
  id: "repository.subscription",
  description: "Subscription repositories used by billing and webhook flows.",
});

export const billingEventRepositoryCorePort = new CorePort<BillingEventRepositoryPort>({
  id: "repository.billing-event",
  description: "BillingEventRepositoryPort for durable billing history.",
});

export const auditEventRepositoryCorePort = new CorePort<AuditEventRepositoryPort>({
  id: "repository.audit-event",
  description: "AuditEventRepositoryPort for security and billing audit records.",
});

export const webhookEventRepositoryCorePort = new CorePort<WebhookEventRepositoryPort>({
  id: "repository.webhook-event",
  description: "WebhookEventRepositoryPort for idempotent webhook processing.",
});

export const userRepositoryCorePort = new CorePort<UserRepositoryPort>({
  id: "repository.user",
  description: "UserRepositoryPort for local identity persistence.",
});

export const userCredentialsRepositoryCorePort = new CorePort<UserCredentialsRepositoryPort>({
  id: "repository.user-credentials",
  description: "UserCredentialsRepositoryPort for password identity persistence.",
});

export const passwordResetTokenRepositoryCorePort = new CorePort<PasswordResetTokenStorePort>({
  id: "repository.password-reset-token",
  description: "PasswordResetTokenStorePort for one-time password recovery tokens.",
});

export const customerRepositoryCorePort = new CorePort<CustomerRepositoryPort>({
  id: "repository.customer",
  description: "CustomerRepositoryPort for organization billing customers.",
});

export const membershipRepositoryCorePort = new CorePort<MembershipRepositoryPort>({
  id: "repository.membership",
  description: "MembershipRepositoryPort for tenant roles and authorization.",
});

export const federatedIdentityRepositoryCorePort = new CorePort<FederatedIdentityRepositoryPort>({
  id: "repository.federated-identity",
  description: "FederatedIdentityRepositoryPort for stable issuer and subject links.",
});
