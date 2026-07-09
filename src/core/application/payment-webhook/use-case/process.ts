import type { ExecutionContext } from "../../../context/execution-context.ts";
import { webhookEventTransitions } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { applicationFailureFactory, useCaseRunner } from "../../shared/index.ts";
import { paymentWebhookSupport } from "../support/helpers.ts";
import type {
  PaymentWebhookProcessAppContext,
  ProcessPaymentWebhookInput,
  ProcessPaymentWebhookOutput,
} from "../types.ts";

/**
 * Processes stored payment webhook events and updates subscriptions.
 */
export class ProcessPaymentWebhookUseCase {
  private readonly appContext: PaymentWebhookProcessAppContext;

  /** Stores parser, repositories and shared ports required by processing. */
  constructor(appContext: PaymentWebhookProcessAppContext) {
    this.appContext = appContext;
  }

  /**
   * Executes webhook parsing, subscription update and processed-state persistence.
   */
  async execute(
    executionContext: ExecutionContext,
    input: ProcessPaymentWebhookInput,
  ): Promise<Result<ProcessPaymentWebhookOutput, CoreError>> {
    return useCaseRunner.runSafely<ProcessPaymentWebhookOutput>(async () =>
      this.appContext.transactionManager.runInTransaction<
        Result<ProcessPaymentWebhookOutput, CoreError>
      >(async (transaction) => {
        const options = { transaction };
        const event = await this.appContext.repositories.webhookEvents.findById(
          input.webhookEventId,
          options,
        );

        if (event === null) {
          return applicationFailureFactory.notFound(
            "payment_webhook.not_found",
            "Webhook event was not found for processing.",
            { webhookEventId: input.webhookEventId },
          );
        }

        const tenant = paymentWebhookSupport.ensureWebhookTenantScope(
          executionContext,
          event.organizationId,
        );
        if (!tenant.ok) {
          return tenant;
        }

        if (event.status === "processed") {
          return ok(Object.freeze({ outcome: "already_processed", event }));
        }

        if (
          (event.status === "processing" ||
            event.status === "failed" ||
            event.status === "unknown") &&
          input.allowReprocess !== true
        ) {
          return applicationFailureFactory.conflict(
            "payment_webhook.reprocess_required",
            "Webhook event requires explicit reprocessing.",
            { webhookEventId: event.id, status: event.status },
          );
        }

        const processing = webhookEventTransitions.markProcessing(event, {
          attemptedAt: this.appContext.clock.now().toISOString(),
        });
        if (!processing.ok) {
          return processing;
        }

        await this.appContext.repositories.webhookEvents.save(processing.data, options);

        const parsed = await this.appContext.paymentWebhookParser.parse({
          executionContext,
          event: processing.data,
        });

        if (!parsed.ok) {
          await paymentWebhookSupport.markEventFailed(
            this.appContext,
            processing.data,
            parsed.error.code,
            options,
          );
          return parsed;
        }

        if (parsed.data.kind === "unknown") {
          const unknown = webhookEventTransitions.markUnknown(processing.data, {
            unknownAt: this.appContext.clock.now().toISOString(),
            ...(parsed.data.reason === undefined ? {} : { reason: parsed.data.reason }),
          });
          if (!unknown.ok) {
            return unknown;
          }

          await this.appContext.repositories.webhookEvents.save(unknown.data, options);
          this.appContext.logger.warn(
            "payment_webhook.unknown",
            paymentWebhookSupport.webhookLogContext(unknown.data, executionContext),
          );

          return ok(Object.freeze({ outcome: "unknown", event: unknown.data }));
        }

        const subscription =
          await this.appContext.repositories.subscriptions.findByProviderSubscriptionId(
            {
              provider: processing.data.provider,
              providerSubscriptionId: parsed.data.providerSubscriptionId,
              ...(processing.data.organizationId === undefined
                ? {}
                : { organizationId: processing.data.organizationId }),
              ...(processing.data.providerConnectionId === undefined
                ? {}
                : { providerConnectionId: processing.data.providerConnectionId }),
            },
            options,
          );

        if (subscription === null) {
          await paymentWebhookSupport.markEventFailed(
            this.appContext,
            processing.data,
            "payment_webhook.subscription_not_found",
            options,
          );
          return applicationFailureFactory.notFound(
            "payment_webhook.subscription_not_found",
            "Subscription was not found for webhook event.",
            {
              webhookEventId: processing.data.id,
              providerSubscriptionId: parsed.data.providerSubscriptionId,
            },
          );
        }

        const occurredAt = parsed.data.occurredAt ?? this.appContext.clock.now().toISOString();
        const updatedSubscription = subscription.applyWebhookStatus({
          status: parsed.data.status,
          providerSubscriptionId: parsed.data.providerSubscriptionId,
          updatedAt: occurredAt,
          ...(parsed.data.providerCustomerId === undefined
            ? {}
            : { providerCustomerId: parsed.data.providerCustomerId }),
          ...(parsed.data.currentPeriodStart === undefined
            ? {}
            : { currentPeriodStart: parsed.data.currentPeriodStart }),
          ...(parsed.data.currentPeriodEnd === undefined
            ? {}
            : { currentPeriodEnd: parsed.data.currentPeriodEnd }),
        });

        if (!updatedSubscription.ok) {
          await paymentWebhookSupport.markEventFailed(
            this.appContext,
            processing.data,
            updatedSubscription.error.code,
            options,
          );
          return updatedSubscription;
        }

        const billingEvent = paymentWebhookSupport.createSubscriptionWebhookAppliedBillingEvent({
          id: this.appContext.idGenerator.newId(),
          occurredAt,
          subscription: updatedSubscription.data,
          event: processing.data,
        });

        if (!billingEvent.ok) {
          await paymentWebhookSupport.markEventFailed(
            this.appContext,
            processing.data,
            billingEvent.error.code,
            options,
          );
          return billingEvent;
        }

        const processed = webhookEventTransitions.markProcessed(processing.data, {
          processedAt: this.appContext.clock.now().toISOString(),
        });
        if (!processed.ok) {
          return processed;
        }

        await this.appContext.repositories.subscriptions.save(updatedSubscription.data, options);
        await this.appContext.repositories.billingEvents.save(billingEvent.data, options);
        await this.appContext.repositories.webhookEvents.save(processed.data, options);
        this.appContext.logger.info(
          "payment_webhook.processed",
          paymentWebhookSupport.webhookLogContext(processed.data, executionContext),
        );

        return ok(
          Object.freeze({
            outcome: "processed",
            event: processed.data,
            subscription: updatedSubscription.data,
            billingEvent: billingEvent.data,
          }),
        );
      }),
    );
  }
}
