import type {
  FindWebhookEventByProviderEventIdInput,
  WebhookEvent,
  WebhookEventInsertResult,
  WebhookEventRepositoryPort,
} from "../core/index.ts";

export type InMemoryWebhookEventRepository = WebhookEventRepositoryPort &
  Readonly<{
    entries: readonly WebhookEvent[];
    clear(): void;
  }>;

/**
 * Stores webhook events in memory while preserving provider-event idempotency.
 */
export class InMemoryWebhookEventRepositoryAdapter implements InMemoryWebhookEventRepository {
  readonly #eventsById = new Map<string, WebhookEvent>();

  readonly #eventIdsByProviderEventId = new Map<string, string>();

  /** Returns an immutable snapshot of stored webhook events. */
  get entries(): readonly WebhookEvent[] {
    return Object.freeze([...this.#eventsById.values()]);
  }

  /**
   * Removes all webhook events from the repository.
   */
  clear(): void {
    this.#eventsById.clear();
    this.#eventIdsByProviderEventId.clear();
  }

  /**
   * Inserts an event only when its provider event id is new.
   */
  async insertIfNotExists(event: WebhookEvent): Promise<WebhookEventInsertResult> {
    const existingId = this.#eventIdsByProviderEventId.get(
      this.webhookEventKey({
        provider: event.provider,
        providerEventId: event.providerEventId,
      }),
    );
    if (existingId !== undefined) {
      const existing = this.#eventsById.get(existingId);
      if (existing !== undefined) {
        return Object.freeze({ inserted: false, event: existing });
      }
    }

    this.saveEvent(event);

    return Object.freeze({ inserted: true, event });
  }

  /**
   * Stores or replaces one webhook event by id.
   */
  async save(event: WebhookEvent): Promise<void> {
    this.saveEvent(event);
  }

  /**
   * Finds one webhook event by id.
   */
  async findById(eventId: string): Promise<WebhookEvent | null> {
    return this.#eventsById.get(eventId) ?? null;
  }

  /**
   * Finds one webhook event by provider and provider event id.
   */
  async findByProviderEventId(
    input: FindWebhookEventByProviderEventIdInput,
  ): Promise<WebhookEvent | null> {
    const eventId = this.#eventIdsByProviderEventId.get(this.webhookEventKey(input));

    return eventId === undefined ? null : (this.#eventsById.get(eventId) ?? null);
  }

  private saveEvent(event: WebhookEvent): void {
    const current = this.#eventsById.get(event.id);
    if (current !== undefined) {
      this.#eventIdsByProviderEventId.delete(
        this.webhookEventKey({
          provider: current.provider,
          providerEventId: current.providerEventId,
        }),
      );
    }

    this.#eventsById.set(event.id, event);
    this.#eventIdsByProviderEventId.set(
      this.webhookEventKey({
        provider: event.provider,
        providerEventId: event.providerEventId,
      }),
      event.id,
    );
  }

  private webhookEventKey(input: FindWebhookEventByProviderEventIdInput): string {
    return `${input.provider}:${input.providerEventId}`;
  }
}

export function createInMemoryWebhookEventRepository(): InMemoryWebhookEventRepository {
  return Object.freeze(new InMemoryWebhookEventRepositoryAdapter());
}
