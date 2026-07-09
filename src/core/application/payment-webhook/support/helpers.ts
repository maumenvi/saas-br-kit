import type { ExecutionContext } from "../../../context/execution-context.ts";
import { BillingEvent, type WebhookEvent, webhookEventTransitions } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import type { RepositoryOperationOptions } from "../../../ports/index.ts";
import { executionPolicy } from "../../shared/index.ts";
import type { CreateSubscriptionWebhookAppliedBillingEventInput } from "../input/create-subscription-webhook-applied-billing-event-input.ts";
import type { PaymentWebhookProcessAppContext } from "../types.ts";

/**
 * Provides shared payment-webhook behaviors used by receive and process flows.
 */
export class PaymentWebhookSupport {
  /**
   * Compatibility facade for legacy static webhook-log-context calls.
   */
  static webhookLogContext(
    event: Pick<
      WebhookEvent,
      "id" | "provider" | "providerEventId" | "eventName" | "organizationId"
    >,
    executionContext: ExecutionContext,
  ): Readonly<Record<string, unknown>> {
    return paymentWebhookSupport.webhookLogContext(event, executionContext);
  }

  /**
   * Compatibility facade for legacy static webhook tenant checks.
   */
  static ensureWebhookTenantScope(
    executionContext: ExecutionContext,
    organizationId: string | undefined,
  ): Result<undefined> {
    return paymentWebhookSupport.ensureWebhookTenantScope(executionContext, organizationId);
  }

  /**
   * Compatibility facade for legacy static webhook failure persistence.
   */
  static markEventFailed(
    appContext: PaymentWebhookProcessAppContext,
    event: WebhookEvent,
    errorCode: string,
    options: RepositoryOperationOptions,
  ): Promise<Result<WebhookEvent, CoreError>> {
    return paymentWebhookSupport.markEventFailed(appContext, event, errorCode, options);
  }

  /**
   * Compatibility facade for legacy static webhook-applied billing events.
   */
  static createSubscriptionWebhookAppliedBillingEvent(
    input: CreateSubscriptionWebhookAppliedBillingEventInput,
  ) {
    return paymentWebhookSupport.createSubscriptionWebhookAppliedBillingEvent(input);
  }

  /**
   * Builds sanitized log context for webhook events without raw payload data.
   */
  webhookLogContext(
    event: Pick<
      WebhookEvent,
      "id" | "provider" | "providerEventId" | "eventName" | "organizationId"
    >,
    executionContext: ExecutionContext,
  ): Readonly<Record<string, unknown>> {
    return Object.freeze({
      requestId: executionContext.requestId,
      webhookEventId: event.id,
      provider: event.provider,
      providerEventId: event.providerEventId,
      eventName: event.eventName,
      ...(event.organizationId === undefined ? {} : { organizationId: event.organizationId }),
    });
  }

  /**
   * Ensures tenant scope only when a webhook is tied to an organization.
   */
  ensureWebhookTenantScope(
    executionContext: ExecutionContext,
    organizationId: string | undefined,
  ): Result<undefined> {
    if (organizationId === undefined) {
      return ok(undefined);
    }

    return executionPolicy.ensureTenantScope(executionContext, organizationId);
  }

  /**
   * Marks and persists a webhook event failure inside the current transaction.
   */
  async markEventFailed(
    appContext: PaymentWebhookProcessAppContext,
    event: WebhookEvent,
    errorCode: string,
    options: RepositoryOperationOptions,
  ): Promise<Result<WebhookEvent, CoreError>> {
    const failed = webhookEventTransitions.markFailed(event, {
      failedAt: appContext.clock.now().toISOString(),
      errorCode,
    });

    if (!failed.ok) {
      return failed;
    }

    await appContext.repositories.webhookEvents.save(failed.data, options);

    return ok(failed.data);
  }

  /**
   * Creates the billing event emitted when a webhook updates a subscription.
   */
  createSubscriptionWebhookAppliedBillingEvent(
    input: CreateSubscriptionWebhookAppliedBillingEventInput,
  ) {
    return BillingEvent.create({
      id: input.id,
      type: "subscription_webhook_applied",
      occurredAt: input.occurredAt,
      organizationId: input.subscription.organizationId,
      planId: input.subscription.planId,
      subscriptionId: input.subscription.id,
      metadata: {
        provider: input.event.provider,
        providerEventId: input.event.providerEventId,
        eventName: input.event.eventName,
        status: input.subscription.status,
      },
    });
  }
}

/** Shared webhook support service used by payment-webhook use cases. */
export const paymentWebhookSupport = new PaymentWebhookSupport();
