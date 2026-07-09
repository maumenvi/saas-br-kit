export type CacheEntry<TValue> = Readonly<{
  value: TValue;
  expiresAt?: Date;
}>;

export type CacheHealthStatus = "up" | "down";

export type CacheHealth = Readonly<{
  status: CacheHealthStatus;
  details?: Readonly<Record<string, unknown>>;
}>;

export type CacheAdapterPort = Readonly<{
  name: string;
  get: <TValue>(key: string) => Promise<CacheEntry<TValue> | null>;
  set: <TValue>(
    key: string,
    entry: CacheEntry<TValue>,
    options?: Readonly<{ ttlSeconds?: number }>,
  ) => Promise<void>;
  delete: (key: string) => Promise<void>;
  healthCheck?: () => Promise<CacheHealth>;
  dispose?: () => Promise<void> | void;
}>;

export type CacheAdapterOperations<TClient extends object> = Readonly<{
  get: <TValue>(client: TClient, key: string) => Promise<CacheEntry<TValue> | null>;
  set: <TValue>(
    client: TClient,
    key: string,
    entry: CacheEntry<TValue>,
    options?: Readonly<{ ttlSeconds?: number }>,
  ) => Promise<void>;
  delete: (client: TClient, key: string) => Promise<void>;
}>;

export type CreateCacheAdapterInput<TClient extends object> = Readonly<{
  name: string;
  client: TClient;
  operations: CacheAdapterOperations<TClient>;
  healthCheck?: (client: TClient) => Promise<CacheHealth>;
  dispose?: (client: TClient) => Promise<void> | void;
}>;

export type CacheAdapter<TClient extends object> = CacheAdapterPort &
  Readonly<{
    client: TClient;
  }>;

export type CacheAdapterContract<TAdapter extends CacheAdapterPort = CacheAdapterPort> = Readonly<{
  name: string;
  createAdapter: () => TAdapter | Promise<TAdapter>;
}>;
