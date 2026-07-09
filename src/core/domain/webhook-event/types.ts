import type { OrganizationId, WebhookEventId } from "../index.ts";
import type { SafeMetadata } from "../metadata/index.ts";
import type { TimestampInput } from "../validation/index.ts";
import type { WebhookEventStatus } from "./status.ts";

export type WebhookEventPayload = string | Readonly<Record<string, unknown>>;

export type WebhookEventProps = Readonly<{
  id: WebhookEventId;
  provider: string;
  providerEventId: string;
  eventName: string;
  status: WebhookEventStatus;
  rawPayload: WebhookEventPayload;
  receivedAt: string;
  updatedAt: string;
  processingAttempts: number;
  organizationId?: OrganizationId;
  providerConnectionId?: string;
  providerAccountId?: string;
  processedAt?: string;
  failedAt?: string;
  unknownAt?: string;
  lastErrorCode?: string;
  analysisReason?: string;
  metadata?: SafeMetadata;
}>;

export type CreateWebhookEventEntityInput = Readonly<{
  id: WebhookEventId;
  provider: string;
  providerEventId: string;
  eventName: string;
  rawPayload: WebhookEventPayload;
  receivedAt: TimestampInput;
  updatedAt?: TimestampInput;
  status?: WebhookEventStatus;
  processingAttempts?: number;
  organizationId?: OrganizationId;
  providerConnectionId?: string;
  providerAccountId?: string;
  processedAt?: TimestampInput;
  failedAt?: TimestampInput;
  unknownAt?: TimestampInput;
  lastErrorCode?: string;
  analysisReason?: string;
  metadata?: SafeMetadata;
}>;

export type MarkWebhookEventProcessingInput = Readonly<{
  attemptedAt: TimestampInput;
}>;

export type MarkWebhookEventProcessedInput = Readonly<{
  processedAt: TimestampInput;
}>;

export type MarkWebhookEventFailedInput = Readonly<{
  failedAt: TimestampInput;
  errorCode: string;
}>;

export type MarkWebhookEventUnknownInput = Readonly<{
  unknownAt: TimestampInput;
  reason?: string;
}>;
