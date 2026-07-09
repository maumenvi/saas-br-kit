import type { ExecutionContext } from "../../../context/execution-context.ts";
import { type AuditEvent, AuditEvent as AuditEventEntity } from "../../../domain/index.ts";
import type { Result } from "../../../errors/result.ts";
import type { CreatePlanCreatedAuditEventInput } from "./create-plan-created-audit-event-input.ts";
import type { CreateSubscriptionCreatedAuditEventInput } from "./create-subscription-created-audit-event-input.ts";
import type { CreateSubscriptionProviderFailedAuditEventInput } from "./create-subscription-provider-failed-audit-event-input.ts";

/** Builds audit events produced by billing-related application flows. */
export class AuditEventFactory {
  /** Extracts safe request and actor fields for persisted audit events. */
  executionFields(executionContext: ExecutionContext) {
    return {
      requestId: executionContext.requestId,
      actorType: executionContext.actor.type,
      ...("id" in executionContext.actor ? { actorId: executionContext.actor.id } : {}),
    };
  }

  /** Creates the audit event emitted after a plan is persisted. */
  planCreated(input: CreatePlanCreatedAuditEventInput): Result<AuditEvent> {
    return AuditEventEntity.create({
      id: input.id,
      type: "billing.plan_created",
      occurredAt: input.occurredAt,
      ...this.executionFields(input.executionContext),
      organizationId: input.plan.organizationId,
      entityType: "plan",
      entityId: input.plan.id,
      metadata: {
        code: input.plan.code,
        amountCents: input.plan.price.amountCents,
        currency: input.plan.price.currency,
        interval: input.plan.price.interval,
      },
    });
  }

  /** Creates the audit event emitted when a payment provider rejects subscription creation. */
  subscriptionProviderFailed(
    input: CreateSubscriptionProviderFailedAuditEventInput,
  ): Result<AuditEvent> {
    return AuditEventEntity.create({
      id: input.id,
      type: "billing.subscription_provider_failed",
      occurredAt: input.occurredAt,
      ...this.executionFields(input.executionContext),
      organizationId: input.subscription.organizationId,
      entityType: "subscription",
      entityId: input.subscription.id,
      metadata: {
        provider: input.provider,
        providerErrorCode: input.providerErrorCode,
        providerErrorKind: input.providerErrorKind,
      },
    });
  }

  /** Creates the audit event emitted after provider-backed subscription creation. */
  subscriptionCreated(input: CreateSubscriptionCreatedAuditEventInput): Result<AuditEvent> {
    return AuditEventEntity.create({
      id: input.id,
      type: "billing.subscription_created",
      occurredAt: input.occurredAt,
      ...this.executionFields(input.executionContext),
      organizationId: input.subscription.organizationId,
      entityType: "subscription",
      entityId: input.subscription.id,
      metadata: {
        provider: input.provider,
        status: input.subscription.status,
      },
    });
  }
}

/** Shared audit event factory used by billing application classes. */
export const auditEventFactory = new AuditEventFactory();

/** Compatibility facade for audit execution fields. */
export const executionAuditFields = (executionContext: ExecutionContext) =>
  auditEventFactory.executionFields(executionContext);

/** Compatibility facade for plan-created audit events. */
export const createPlanCreatedAuditEvent = (
  input: CreatePlanCreatedAuditEventInput,
): Result<AuditEvent> => auditEventFactory.planCreated(input);

/** Compatibility facade for subscription-provider-failed audit events. */
export const createSubscriptionProviderFailedAuditEvent = (
  input: CreateSubscriptionProviderFailedAuditEventInput,
): Result<AuditEvent> => auditEventFactory.subscriptionProviderFailed(input);

/** Compatibility facade for subscription-created audit events. */
export const createSubscriptionCreatedAuditEvent = (
  input: CreateSubscriptionCreatedAuditEventInput,
): Result<AuditEvent> => auditEventFactory.subscriptionCreated(input);
