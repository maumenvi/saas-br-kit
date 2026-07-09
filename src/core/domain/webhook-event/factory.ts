import { ok, type Result } from "../../errors/result.ts";
import { freezeSafeMetadata } from "../metadata/index.ts";
import {
  ensureAllowedString,
  normalizeOptionalText,
  normalizeOptionalTimestamp,
  normalizeRequiredText,
  normalizeTimestamp,
} from "../validation/index.ts";
import { webhookEventInputNormalizer } from "./normalizer.ts";
import { WEBHOOK_EVENT_STATUSES } from "./status.ts";
import type { CreateWebhookEventEntityInput, WebhookEventProps } from "./types.ts";

/**
 * Builds normalized properties for immutable webhook events.
 */
export class WebhookEventFactory {
  /**
   * Validates webhook identity, state, timestamps and optional provider context.
   */
  createProps(input: CreateWebhookEventEntityInput): Result<WebhookEventProps> {
    const id = normalizeRequiredText("webhookEvent.id", input.id, { maxLength: 120 });
    if (!id.ok) {
      return id;
    }

    const provider = normalizeRequiredText("webhookEvent.provider", input.provider, {
      maxLength: 80,
    });
    if (!provider.ok) {
      return provider;
    }

    const providerEventId = normalizeRequiredText(
      "webhookEvent.providerEventId",
      input.providerEventId,
      { maxLength: 180 },
    );
    if (!providerEventId.ok) {
      return providerEventId;
    }

    const eventName = normalizeRequiredText("webhookEvent.eventName", input.eventName, {
      maxLength: 180,
    });
    if (!eventName.ok) {
      return eventName;
    }

    const status = ensureAllowedString(
      "webhookEvent.status",
      input.status ?? "pending",
      WEBHOOK_EVENT_STATUSES,
    );
    if (!status.ok) {
      return status;
    }

    const receivedAt = normalizeTimestamp("webhookEvent.receivedAt", input.receivedAt);
    if (!receivedAt.ok) {
      return receivedAt;
    }

    const updatedAt = normalizeTimestamp(
      "webhookEvent.updatedAt",
      input.updatedAt ?? receivedAt.data,
    );
    if (!updatedAt.ok) {
      return updatedAt;
    }

    const processedAt = normalizeOptionalTimestamp("webhookEvent.processedAt", input.processedAt);
    if (!processedAt.ok) {
      return processedAt;
    }

    const failedAt = normalizeOptionalTimestamp("webhookEvent.failedAt", input.failedAt);
    if (!failedAt.ok) {
      return failedAt;
    }

    const unknownAt = normalizeOptionalTimestamp("webhookEvent.unknownAt", input.unknownAt);
    if (!unknownAt.ok) {
      return unknownAt;
    }

    const organizationId = normalizeOptionalText(
      "webhookEvent.organizationId",
      input.organizationId,
      { maxLength: 120 },
    );
    if (!organizationId.ok) {
      return organizationId;
    }

    const providerConnectionId = normalizeOptionalText(
      "webhookEvent.providerConnectionId",
      input.providerConnectionId,
      { maxLength: 120 },
    );
    if (!providerConnectionId.ok) {
      return providerConnectionId;
    }

    const providerAccountId = normalizeOptionalText(
      "webhookEvent.providerAccountId",
      input.providerAccountId,
      { maxLength: 120 },
    );
    if (!providerAccountId.ok) {
      return providerAccountId;
    }

    const lastErrorCode = normalizeOptionalText("webhookEvent.lastErrorCode", input.lastErrorCode, {
      maxLength: 160,
    });
    if (!lastErrorCode.ok) {
      return lastErrorCode;
    }

    const analysisReason = normalizeOptionalText(
      "webhookEvent.analysisReason",
      input.analysisReason,
      { maxLength: 240 },
    );
    if (!analysisReason.ok) {
      return analysisReason;
    }

    const processingAttempts = webhookEventInputNormalizer.validateProcessingAttempts(
      input.processingAttempts ?? 0,
    );
    if (!processingAttempts.ok) {
      return processingAttempts;
    }

    const metadata = freezeSafeMetadata(input.metadata);

    return ok({
      id: id.data,
      provider: provider.data,
      providerEventId: providerEventId.data,
      eventName: eventName.data,
      status: status.data,
      rawPayload: webhookEventInputNormalizer.freezePayload(input.rawPayload),
      receivedAt: receivedAt.data,
      updatedAt: updatedAt.data,
      processingAttempts: processingAttempts.data,
      ...(organizationId.data === undefined ? {} : { organizationId: organizationId.data }),
      ...(providerConnectionId.data === undefined
        ? {}
        : { providerConnectionId: providerConnectionId.data }),
      ...(providerAccountId.data === undefined
        ? {}
        : { providerAccountId: providerAccountId.data }),
      ...(processedAt.data === undefined ? {} : { processedAt: processedAt.data }),
      ...(failedAt.data === undefined ? {} : { failedAt: failedAt.data }),
      ...(unknownAt.data === undefined ? {} : { unknownAt: unknownAt.data }),
      ...(lastErrorCode.data === undefined ? {} : { lastErrorCode: lastErrorCode.data }),
      ...(analysisReason.data === undefined ? {} : { analysisReason: analysisReason.data }),
      ...(metadata === undefined ? {} : { metadata }),
    });
  }
}

/** Shared webhook event factory used by the entity compatibility facade. */
export const webhookEventFactory = new WebhookEventFactory();
