/// <reference types="node" />

import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();

async function loadModule(modulePath: string): Promise<Record<string, unknown>> {
  const filePath = path.join(rootDir, modulePath);
  return import(pathToFileURL(filePath).href);
}

const uncoveredClasses = [
  { className: "CoreResultFactory", modulePath: "src/core/errors/result.ts" },
  {
    className: "MembershipPermissionService",
    modulePath: "src/core/application/membership/service/permissions.ts",
  },
  {
    className: "MembershipOrganizationService",
    modulePath: "src/core/application/membership/service/organizations.ts",
  },
  { className: "CorePortRegistry", modulePath: "src/core/composition/registry.ts" },
  { className: "SaasBrApplication", modulePath: "src/core/composition/application.ts" },
  { className: "CoreContextMerger", modulePath: "src/core/composition/context-merger.ts" },
  {
    className: "CoreContextAssembler",
    modulePath: "src/core/composition/context-assembler.ts",
  },
  {
    className: "CoreRegistrationResolver",
    modulePath: "src/core/composition/resolver.ts",
  },
  { className: "AuthSessionService", modulePath: "src/core/application/auth/service/sessions.ts" },
  { className: "AuthFailures", modulePath: "src/core/application/auth/service/errors.ts" },
  {
    className: "FederatedSessionService",
    modulePath: "src/core/application/auth/service/federated-session.ts",
  },
  {
    className: "PasswordIdentityAuthenticator",
    modulePath: "src/core/application/auth/service/password-identity-authenticator.ts",
  },
  { className: "LogSanitizer", modulePath: "src/core/ports/logger.ts" },
  {
    className: "PaymentWebhookSupport",
    modulePath: "src/core/application/payment-webhook/support/helpers.ts",
  },
  {
    className: "AuthenticatedOrganizationAccessService",
    modulePath: "src/core/application/auth/service/organization-access.ts",
  },
  { className: "ActiveUserLoader", modulePath: "src/core/application/auth/service/users.ts" },
  {
    className: "WebhookEventInputNormalizer",
    modulePath: "src/core/domain/webhook-event/normalizer.ts",
  },
  { className: "WebhookEventFactory", modulePath: "src/core/domain/webhook-event/factory.ts" },
  {
    className: "ApplicationFailureFactory",
    modulePath: "src/core/application/shared/errors.ts",
  },
  { className: "ExecutionPolicy", modulePath: "src/core/application/shared/guards.ts" },
  {
    className: "MembershipPermissionPolicy",
    modulePath: "src/core/domain/membership/permissions.ts",
  },
  { className: "UseCaseRunner", modulePath: "src/core/application/shared/use-case.ts" },
  {
    className: "SubscriptionBuilder",
    modulePath: "src/core/domain/subscription/builder.ts",
  },
  { className: "EmailNormalizer", modulePath: "src/core/domain/validation/email.ts" },
  {
    className: "SubscriptionAccessPolicy",
    modulePath: "src/core/domain/subscription/policy.ts",
  },
  { className: "TextNormalizer", modulePath: "src/core/domain/validation/text.ts" },
  {
    className: "RefreshTokenSession",
    modulePath: "src/core/domain/refresh-token/types.ts",
  },
  {
    className: "DomainErrorFactory",
    modulePath: "src/core/domain/validation/errors.ts",
  },
  {
    className: "SubscriptionPeriodPolicy",
    modulePath: "src/core/domain/validation/subscription.ts",
  },
  {
    className: "RefreshTokenSessionPolicy",
    modulePath: "src/core/domain/refresh-token/policy.ts",
  },
  { className: "PlanNormalizer", modulePath: "src/core/domain/validation/plan.ts" },
  {
    className: "AllowedStringPolicy",
    modulePath: "src/core/domain/validation/allowed-values.ts",
  },
  {
    className: "TimestampNormalizer",
    modulePath: "src/core/domain/validation/timestamp.ts",
  },
  {
    className: "MetadataNormalizer",
    modulePath: "src/core/domain/metadata/normalizer.ts",
  },
  {
    className: "AuditEventFactory",
    modulePath: "src/core/application/events/audit/audit-event-factory.ts",
  },
  {
    className: "SubscriptionCustomerSnapshot",
    modulePath: "src/core/application/subscription/snapshot/subscription-customer-snapshot.ts",
  },
  {
    className: "BillingEventFactory",
    modulePath: "src/core/application/events/billing/billing-event-factory.ts",
  },
] as const;

test("all previously uncovered exported classes are loadable", async () => {
  for (const target of uncoveredClasses) {
    const module = await loadModule(target.modulePath);
    assert.equal(
      target.className in module,
      true,
      `${target.className} export missing in ${target.modulePath}`,
    );
    assert.equal(typeof module[target.className], "function");
  }
});
