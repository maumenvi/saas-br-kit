import {
  AuditEvent,
  BillingEvent,
  Customer,
  FederatedIdentity,
  Membership,
  Organization,
  Plan,
  Subscription,
  User,
  UserCredentials,
  WebhookEvent,
} from "#core";
import type {
  PrismaDatabaseClient,
  PrismaModelDelegate,
  PrismaTransactionClient,
} from "../../../src/adapters/database-prisma/prisma-types.ts";

type Result<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: { readonly message: string } };

export function unwrap<T>(result: Result<T>): T {
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export function makeDelegate(overrides: Partial<PrismaModelDelegate> = {}): PrismaModelDelegate {
  return {
    upsert: async () => undefined,
    create: async () => undefined,
    update: async () => undefined,
    findUnique: async () => null,
    findFirst: async () => null,
    findMany: async () => [],
    deleteMany: async () => undefined,
    ...overrides,
  };
}

type ModelName =
  | "organization"
  | "user"
  | "userCredentials"
  | "federatedIdentity"
  | "passwordResetToken"
  | "customer"
  | "membership"
  | "plan"
  | "subscription"
  | "billingEvent"
  | "auditEvent"
  | "webhookEvent";

export function makeClient(
  overrides: Partial<Record<ModelName, PrismaModelDelegate>> = {},
): PrismaDatabaseClient {
  const transactionClient = {} as PrismaTransactionClient;
  return {
    organization: makeDelegate(),
    user: makeDelegate(),
    userCredentials: makeDelegate(),
    federatedIdentity: makeDelegate(),
    passwordResetToken: makeDelegate(),
    customer: makeDelegate(),
    membership: makeDelegate(),
    plan: makeDelegate(),
    subscription: makeDelegate(),
    billingEvent: makeDelegate(),
    auditEvent: makeDelegate(),
    webhookEvent: makeDelegate(),
    $transaction: async (operation) => operation(transactionClient),
    ...overrides,
  };
}

export const timestamp = "2026-01-02T03:04:05.000Z";
export const laterTimestamp = "2026-02-03T04:05:06.000Z";

export function makeOrganization(): Organization {
  return unwrap(
    Organization.create({
      id: "org_1",
      ownerUserId: "user_1",
      name: "Acme",
      status: "disabled",
      metadata: { source: "test", seats: 3 },
      createdAt: timestamp,
      updatedAt: laterTimestamp,
    }),
  );
}

export function makePlan(): Plan {
  return unwrap(
    Plan.create({
      id: "plan_1",
      organizationId: "org_1",
      code: "pro",
      name: "Pro",
      amountCents: 9900,
      currency: "BRL",
      interval: "monthly",
      features: ["reports", "exports"],
      status: "inactive",
      metadata: { source: "test", featured: true },
      createdAt: timestamp,
      updatedAt: laterTimestamp,
    }),
  );
}

export function makeSubscription(): Subscription {
  return unwrap(
    Subscription.create({
      id: "sub_1",
      organizationId: "org_1",
      userId: "user_1",
      planId: "plan_1",
      status: "active",
      provider: "asaas",
      providerConnectionId: "connection_1",
      providerCustomerId: "customer_1",
      providerSubscriptionId: "provider_sub_1",
      currentPeriodStart: timestamp,
      currentPeriodEnd: laterTimestamp,
      metadata: { source: "test", seats: 3 },
      createdAt: timestamp,
      updatedAt: laterTimestamp,
    }),
  );
}

export function makeBillingEvent(): BillingEvent {
  return unwrap(
    BillingEvent.create({
      id: "billing_event_1",
      type: "subscription_created",
      occurredAt: timestamp,
      organizationId: "org_1",
      planId: "plan_1",
      subscriptionId: "sub_1",
      metadata: { source: "test" },
    }),
  );
}

export function makeCustomer(): Customer {
  return unwrap(
    Customer.create({
      id: "customer_1",
      organizationId: "org_1",
      name: "Customer",
      email: "customer@example.com",
      document: "12345678901",
      metadata: { preferences: { locale: "pt-BR" }, tags: ["a", "b"] },
      createdAt: timestamp,
      updatedAt: laterTimestamp,
    }),
  );
}

export function makeUser(): User {
  return unwrap(
    User.create({
      id: "user_1",
      email: "user@example.com",
      displayName: "User Example",
      createdAt: timestamp,
      updatedAt: laterTimestamp,
    }),
  );
}

export function makeUserCredentials(): UserCredentials {
  return unwrap(
    UserCredentials.create({
      userId: "user_1",
      email: "user@example.com",
      passwordHash: "scrypt$salt$hash",
      createdAt: timestamp,
      updatedAt: laterTimestamp,
    }),
  );
}

export function makeFederatedIdentity(): FederatedIdentity {
  return unwrap(
    FederatedIdentity.create({
      id: "federated_identity_1",
      userId: "user_1",
      providerId: "google",
      issuer: "https://accounts.google.com",
      subject: "google_subject_1",
      email: "user@example.com",
      createdAt: timestamp,
      updatedAt: laterTimestamp,
    }),
  );
}

export function makeMembership(): Membership {
  return unwrap(
    Membership.create({
      id: "membership_1",
      organizationId: "org_1",
      userId: "user_1",
      role: "employee",
      status: "active",
      invitedByUserId: "owner_1",
      createdAt: timestamp,
      updatedAt: laterTimestamp,
    }),
  );
}

export function makeAuditEvent(): AuditEvent {
  return unwrap(
    AuditEvent.create({
      id: "audit_event_1",
      type: "billing.subscription_created",
      occurredAt: timestamp,
      requestId: "request_1",
      actorType: "service",
      actorId: "service_1",
      organizationId: "org_1",
      entityType: "subscription",
      entityId: "sub_1",
      metadata: { source: "test" },
    }),
  );
}

export function makeWebhookEvent(): WebhookEvent {
  return unwrap(
    WebhookEvent.create({
      id: "webhook_1",
      provider: "asaas",
      providerEventId: "event_1",
      eventName: "PAYMENT_RECEIVED",
      status: "processed",
      rawPayload: { payment: "payment_1", nested: { accepted: true } },
      receivedAt: timestamp,
      updatedAt: laterTimestamp,
      processingAttempts: 2,
      organizationId: "org_1",
      providerConnectionId: "connection_1",
      providerAccountId: "account_1",
      processedAt: laterTimestamp,
      lastErrorCode: "previous_error",
      analysisReason: "replayed",
      metadata: { source: "test" },
    }),
  );
}
