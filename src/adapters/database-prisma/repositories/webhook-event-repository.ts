import type {
  FindWebhookEventByProviderEventIdInput,
  RepositoryOperationOptions,
  WebhookEvent,
  WebhookEventInsertResult,
  WebhookEventRepositoryPort,
} from "#core";
import { prismaWebhookEventMapper } from "../mappers/index.ts";
import type { PrismaRepositoryContext } from "./context.ts";

/** Persists webhook events with provider idempotency through Prisma. */
export class PrismaWebhookEventRepository implements WebhookEventRepositoryPort {
  private readonly context: PrismaRepositoryContext;

  /** Stores the repository context used to resolve transactions. */
  constructor(context: PrismaRepositoryContext) {
    this.context = context;
  }

  /** Inserts a webhook when its provider event id is new. */
  async insertIfNotExists(
    event: WebhookEvent,
    options?: RepositoryOperationOptions,
  ): Promise<WebhookEventInsertResult> {
    const existing = await this.findByProviderEventId(
      { provider: event.provider, providerEventId: event.providerEventId },
      options,
    );

    if (existing !== null) {
      return { inserted: false, event: existing };
    }

    await this.context.getClient(options).webhookEvent.create({
      data: prismaWebhookEventMapper.toPersistence(event),
    });

    return { inserted: true, event };
  }

  /** Saves a webhook state transition. */
  async save(event: WebhookEvent, options?: RepositoryOperationOptions): Promise<void> {
    const data = prismaWebhookEventMapper.toPersistence(event);
    await this.context.getClient(options).webhookEvent.upsert({
      where: { id: event.id },
      create: data,
      update: data,
    });
  }

  /** Finds a webhook event by id. */
  async findById(
    eventId: string,
    options?: RepositoryOperationOptions,
  ): Promise<WebhookEvent | null> {
    const row = await this.context.getClient(options).webhookEvent.findUnique({
      where: { id: eventId },
    });
    return row === null ? null : prismaWebhookEventMapper.toDomain(row);
  }

  /** Finds a webhook event by provider idempotency key. */
  async findByProviderEventId(
    input: FindWebhookEventByProviderEventIdInput,
    options?: RepositoryOperationOptions,
  ): Promise<WebhookEvent | null> {
    const row = await this.context.getClient(options).webhookEvent.findUnique({
      where: {
        provider_providerEventId: {
          provider: input.provider,
          providerEventId: input.providerEventId,
        },
      },
    });
    return row === null ? null : prismaWebhookEventMapper.toDomain(row);
  }
}
