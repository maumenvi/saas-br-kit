import type { Result } from "../../errors/result.ts";
import type { TimestampInput } from "../validation/index.ts";
import { WebhookEvent } from "./entity.ts";
import type {
  CreateWebhookEventEntityInput,
  MarkWebhookEventFailedInput,
  MarkWebhookEventProcessedInput,
  MarkWebhookEventProcessingInput,
  MarkWebhookEventUnknownInput,
} from "./types.ts";

/**
 * Applies immutable state transitions to webhook event entities.
 */
export class WebhookEventTransitions {
  /**
   * Compatibility facade for legacy static processing-transition calls.
   */
  static markProcessing(
    event: WebhookEvent,
    input: MarkWebhookEventProcessingInput,
  ): Result<WebhookEvent> {
    return webhookEventTransitions.markProcessing(event, input);
  }

  /**
   * Compatibility facade for legacy static processed-transition calls.
   */
  static markProcessed(
    event: WebhookEvent,
    input: MarkWebhookEventProcessedInput,
  ): Result<WebhookEvent> {
    return webhookEventTransitions.markProcessed(event, input);
  }

  /**
   * Compatibility facade for legacy static failed-transition calls.
   */
  static markFailed(event: WebhookEvent, input: MarkWebhookEventFailedInput): Result<WebhookEvent> {
    return webhookEventTransitions.markFailed(event, input);
  }

  /**
   * Compatibility facade for legacy static unknown-transition calls.
   */
  static markUnknown(
    event: WebhookEvent,
    input: MarkWebhookEventUnknownInput,
  ): Result<WebhookEvent> {
    return webhookEventTransitions.markUnknown(event, input);
  }

  /**
   * Marks a webhook event as processing and increments the attempt counter.
   */
  markProcessing(
    event: WebhookEvent,
    input: MarkWebhookEventProcessingInput,
  ): Result<WebhookEvent> {
    return WebhookEvent.create({
      ...this.createBaseInput(event, input.attemptedAt),
      status: "processing",
      processingAttempts: event.processingAttempts + 1,
    });
  }

  /**
   * Marks a webhook event as processed after successful application.
   */
  markProcessed(event: WebhookEvent, input: MarkWebhookEventProcessedInput): Result<WebhookEvent> {
    return WebhookEvent.create({
      ...this.createBaseInput(event, input.processedAt),
      status: "processed",
      processingAttempts: event.processingAttempts,
      processedAt: input.processedAt,
    });
  }

  /**
   * Marks a webhook event as failed with a normalized error code.
   */
  markFailed(event: WebhookEvent, input: MarkWebhookEventFailedInput): Result<WebhookEvent> {
    return WebhookEvent.create({
      ...this.createBaseInput(event, input.failedAt),
      status: "failed",
      processingAttempts: event.processingAttempts,
      failedAt: input.failedAt,
      lastErrorCode: input.errorCode,
    });
  }

  /**
   * Marks a webhook event as unknown for later manual or automated analysis.
   */
  markUnknown(event: WebhookEvent, input: MarkWebhookEventUnknownInput): Result<WebhookEvent> {
    return WebhookEvent.create({
      ...this.createBaseInput(event, input.unknownAt),
      status: "unknown",
      processingAttempts: event.processingAttempts,
      unknownAt: input.unknownAt,
      ...(input.reason === undefined ? {} : { analysisReason: input.reason }),
    });
  }

  /**
   * Builds transition input while preserving immutable event identity and metadata.
   */
  private createBaseInput(
    event: WebhookEvent,
    updatedAt: TimestampInput,
  ): CreateWebhookEventEntityInput {
    return {
      id: event.id,
      provider: event.provider,
      providerEventId: event.providerEventId,
      eventName: event.eventName,
      rawPayload: event.rawPayload,
      receivedAt: event.receivedAt,
      updatedAt,
      processingAttempts: event.processingAttempts,
      ...(event.organizationId === undefined ? {} : { organizationId: event.organizationId }),
      ...(event.providerConnectionId === undefined
        ? {}
        : { providerConnectionId: event.providerConnectionId }),
      ...(event.providerAccountId === undefined
        ? {}
        : { providerAccountId: event.providerAccountId }),
      ...(event.metadata === undefined ? {} : { metadata: event.metadata }),
    };
  }
}

/** Shared webhook transition service used by payment-webhook application classes. */
export const webhookEventTransitions = new WebhookEventTransitions();

/** Compatibility facade for legacy webhook processing transitions. */
export const markWebhookEventProcessing = (
  event: WebhookEvent,
  input: MarkWebhookEventProcessingInput,
): Result<WebhookEvent> => webhookEventTransitions.markProcessing(event, input);

/** Compatibility facade for legacy webhook processed transitions. */
export const markWebhookEventProcessed = (
  event: WebhookEvent,
  input: MarkWebhookEventProcessedInput,
): Result<WebhookEvent> => webhookEventTransitions.markProcessed(event, input);

/** Compatibility facade for legacy webhook failed transitions. */
export const markWebhookEventFailed = (
  event: WebhookEvent,
  input: MarkWebhookEventFailedInput,
): Result<WebhookEvent> => webhookEventTransitions.markFailed(event, input);

/** Compatibility facade for legacy webhook unknown transitions. */
export const markWebhookEventUnknown = (
  event: WebhookEvent,
  input: MarkWebhookEventUnknownInput,
): Result<WebhookEvent> => webhookEventTransitions.markUnknown(event, input);
