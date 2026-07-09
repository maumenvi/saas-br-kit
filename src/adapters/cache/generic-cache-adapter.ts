import type {
  CacheAdapter,
  CacheAdapterOperations,
  CacheEntry,
  CacheHealth,
  CreateCacheAdapterInput,
} from "./types.ts";

/**
 * Stores a generic cache client and delegates operations through dependency-free callbacks.
 */
export class GenericCacheAdapter<TClient extends object> implements CacheAdapter<TClient> {
  /** Adapter name exposed to diagnostics and runtime composition. */
  public readonly name: string;

  /** Native cache client preserved for external adapter code. */
  public readonly client: TClient;

  /** Optional health check bound to the native cache client. */
  public readonly healthCheck?: () => Promise<CacheHealth>;

  /** Optional cleanup hook bound to the native cache client. */
  public readonly dispose?: () => Promise<void>;

  private readonly operations: CacheAdapterOperations<TClient>;

  /** Stores adapter callbacks while preserving the native client. */
  constructor(input: CreateCacheAdapterInput<TClient>) {
    this.name = input.name;
    this.client = input.client;
    this.operations = input.operations;

    if (input.healthCheck !== undefined) {
      const healthCheck = input.healthCheck;
      this.healthCheck = async () => healthCheck(this.client);
    }

    if (input.dispose !== undefined) {
      const dispose = input.dispose;
      this.dispose = async () => {
        await dispose(this.client);
      };
    }

    Object.freeze(this);
  }

  /**
   * Reads one cache entry through the configured adapter operation.
   */
  async get<TValue>(key: string): Promise<CacheEntry<TValue> | null> {
    return this.operations.get<TValue>(this.client, key);
  }

  /**
   * Writes one cache entry through the configured adapter operation.
   */
  async set<TValue>(
    key: string,
    entry: CacheEntry<TValue>,
    options?: Readonly<{ ttlSeconds?: number }>,
  ): Promise<void> {
    return this.operations.set<TValue>(this.client, key, entry, options);
  }

  /**
   * Deletes one cache entry through the configured adapter operation.
   */
  async delete(key: string): Promise<void> {
    return this.operations.delete(this.client, key);
  }
}
