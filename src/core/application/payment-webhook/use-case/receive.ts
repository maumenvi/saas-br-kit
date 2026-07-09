import type { ExecutionContext } from "../../../context/execution-context.ts";
import { WebhookEvent } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { useCaseRunner } from "../../shared/index.ts";
import { paymentWebhookSupport } from "../support/helpers.ts";
import type {
  PaymentWebhookReceiveAppContext,
  ReceivePaymentWebhookInput,
  ReceivePaymentWebhookOutput,
} from "../types.ts";

/**
 * Verifies and stores payment webhook events idempotently.
 */
export class ReceivePaymentWebhookUseCase {
  private readonly appContext: PaymentWebhookReceiveAppContext;

  /** Stores webhook verifier and repository ports. */
  constructor(appContext: PaymentWebhookReceiveAppContext) {
    this.appContext = appContext;
  }

  /**
   * Executes webhook verification and idempotent insertion.
   */
  async execute(
    executionContext: ExecutionContext,
    input: ReceivePaymentWebhookInput,
  ): Promise<Result<ReceivePaymentWebhookOutput, CoreError>> {
    const tenant = paymentWebhookSupport.ensureWebhookTenantScope(
      executionContext,
      input.organizationId,
    );
    if (!tenant.ok) {
      return tenant;
    }

    return useCaseRunner.runSafely<ReceivePaymentWebhookOutput>(async () => {
      const receivedAt = input.receivedAt ?? this.appContext.clock.now();
      const receivedAtIso = typeof receivedAt === "string" ? receivedAt : receivedAt.toISOString();
      const verification = await this.appContext.paymentWebhookVerifier.verify({
        executionContext,
        provider: input.provider,
        providerEventId: input.providerEventId,
        eventName: input.eventName,
        rawPayload: input.rawPayload,
        receivedAt: receivedAtIso,
        ...(input.headers === undefined ? {} : { headers: input.headers }),
        ...(input.organizationId === undefined ? {} : { organizationId: input.organizationId }),
        ...(input.providerConnectionId === undefined
          ? {}
          : { providerConnectionId: input.providerConnectionId }),
        ...(input.providerAccountId === undefined
          ? {}
          : { providerAccountId: input.providerAccountId }),
      });

      if (!verification.ok) {
        return verification;
      }

      const event = WebhookEvent.create({
        id: this.appContext.idGenerator.newId(),
        provider: input.provider,
        providerEventId: input.providerEventId,
        eventName: input.eventName,
        rawPayload: input.rawPayload,
        receivedAt: receivedAtIso,
        ...(input.organizationId === undefined ? {} : { organizationId: input.organizationId }),
        ...(input.providerConnectionId === undefined
          ? {}
          : { providerConnectionId: input.providerConnectionId }),
        ...(input.providerAccountId === undefined
          ? {}
          : { providerAccountId: input.providerAccountId }),
        ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
      });

      if (!event.ok) {
        return event;
      }

      const insert = await this.appContext.repositories.webhookEvents.insertIfNotExists(event.data);
      const outcome = insert.inserted ? "stored" : "duplicate";
      const message = insert.inserted ? "payment_webhook.received" : "payment_webhook.duplicate";
      this.appContext.logger.info(
        message,
        paymentWebhookSupport.webhookLogContext(insert.event, executionContext),
      );

      return ok(
        Object.freeze({
          outcome,
          event: insert.event,
          verificationStatus: verification.data.status,
        }),
      );
    });
  }
}
