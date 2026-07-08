import { WebhookEvent, type WebhookEventPayload, type WebhookEventStatus } from "#core";
import { asRow, jsonValue, optionalString, safeMetadata, toIsoString } from "./helpers.ts";

/** Maps WebhookEvent entities to and from Prisma rows. */
export class PrismaWebhookEventMapper {
  /** Converts a domain webhook event into Prisma persistence data. */
  toPersistence(event: WebhookEvent): Record<string, unknown> {
    return {
      id: event.id,
      provider: event.provider,
      providerEventId: event.providerEventId,
      eventName: event.eventName,
      status: event.status,
      rawPayload: jsonValue(event.rawPayload),
      receivedAt: new Date(event.receivedAt),
      updatedAt: new Date(event.updatedAt),
      processingAttempts: event.processingAttempts,
      organizationId: event.organizationId,
      providerConnectionId: event.providerConnectionId,
      providerAccountId: event.providerAccountId,
      processedAt: event.processedAt === undefined ? undefined : new Date(event.processedAt),
      failedAt: event.failedAt === undefined ? undefined : new Date(event.failedAt),
      unknownAt: event.unknownAt === undefined ? undefined : new Date(event.unknownAt),
      lastErrorCode: event.lastErrorCode,
      analysisReason: event.analysisReason,
      metadata: event.metadata === undefined ? undefined : jsonValue(event.metadata),
    };
  }

  /** Rehydrates a domain webhook event from a Prisma row. */
  toDomain(row: unknown): WebhookEvent {
    const data = asRow(row);
    const organizationId = optionalString(data.organizationId);
    const providerConnectionId = optionalString(data.providerConnectionId);
    const providerAccountId = optionalString(data.providerAccountId);
    const lastErrorCode = optionalString(data.lastErrorCode);
    const analysisReason = optionalString(data.analysisReason);
    const metadata = safeMetadata(data.metadata);
    const result = WebhookEvent.create({
      id: String(data.id),
      provider: String(data.provider),
      providerEventId: String(data.providerEventId),
      eventName: String(data.eventName),
      status: String(data.status) as WebhookEventStatus,
      rawPayload: data.rawPayload as WebhookEventPayload,
      receivedAt: toIsoString(data.receivedAt),
      updatedAt: toIsoString(data.updatedAt),
      processingAttempts: Number(data.processingAttempts),
      ...(organizationId === undefined ? {} : { organizationId }),
      ...(providerConnectionId === undefined ? {} : { providerConnectionId }),
      ...(providerAccountId === undefined ? {} : { providerAccountId }),
      ...(data.processedAt === null || data.processedAt === undefined
        ? {}
        : { processedAt: toIsoString(data.processedAt) }),
      ...(data.failedAt === null || data.failedAt === undefined
        ? {}
        : { failedAt: toIsoString(data.failedAt) }),
      ...(data.unknownAt === null || data.unknownAt === undefined
        ? {}
        : { unknownAt: toIsoString(data.unknownAt) }),
      ...(lastErrorCode === undefined ? {} : { lastErrorCode }),
      ...(analysisReason === undefined ? {} : { analysisReason }),
      ...(metadata === undefined ? {} : { metadata }),
    });

    if (!result.ok) {
      throw new Error(result.error.message);
    }

    return result.data;
  }
}

export const prismaWebhookEventMapper = new PrismaWebhookEventMapper();
