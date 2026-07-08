import type { WebhookEvent } from "../../domain/index.ts";
import type { RepositoryOperationOptions } from "./options.ts";

export type WebhookEventInsertResult =
  | Readonly<{
      inserted: true;
      event: WebhookEvent;
    }>
  | Readonly<{
      inserted: false;
      event: WebhookEvent;
    }>;

export type FindWebhookEventByProviderEventIdInput = Readonly<{
  provider: string;
  providerEventId: string;
}>;

export type WebhookEventRepositoryPort = Readonly<{
  insertIfNotExists(
    event: WebhookEvent,
    options?: RepositoryOperationOptions,
  ): Promise<WebhookEventInsertResult>;
  save(event: WebhookEvent, options?: RepositoryOperationOptions): Promise<void>;
  findById(eventId: string, options?: RepositoryOperationOptions): Promise<WebhookEvent | null>;
  findByProviderEventId(
    input: FindWebhookEventByProviderEventIdInput,
    options?: RepositoryOperationOptions,
  ): Promise<WebhookEvent | null>;
}>;
