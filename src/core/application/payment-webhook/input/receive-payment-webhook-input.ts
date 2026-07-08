import type { SafeMetadata, WebhookEventPayload } from "../../../domain/index.ts";

export type ReceivePaymentWebhookInput = Readonly<{
  provider: string;
  providerEventId: string;
  eventName: string;
  rawPayload: WebhookEventPayload;
  headers?: Readonly<Record<string, string | readonly string[]>>;
  organizationId?: string;
  providerConnectionId?: string;
  providerAccountId?: string;
  receivedAt?: string | Date;
  metadata?: SafeMetadata;
}>;
