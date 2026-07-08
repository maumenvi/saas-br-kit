import type { TransactionManagerPort, TransactionScope } from "../../core/index.ts";

export type DatabaseHealthStatus = "up" | "down";

export type DatabaseHealth = Readonly<{
  status: DatabaseHealthStatus;
  details?: Readonly<Record<string, unknown>>;
}>;

export type DatabaseAdapterPort = Readonly<{
  name: string;
  transactionManager: TransactionManagerPort;
  healthCheck?: () => Promise<DatabaseHealth>;
  dispose?: () => Promise<void> | void;
}>;

export type DatabaseTransactionRunner<TClient, TTransactionClient> = <TValue>(
  client: TClient,
  operation: (client: TTransactionClient) => Promise<TValue>,
) => Promise<TValue>;

export type DatabaseTransactionConfig<TClient, TTransactionClient> = Readonly<{
  run: DatabaseTransactionRunner<TClient, TTransactionClient>;
}>;

export type CreateDatabaseAdapterInput<
  TClient extends object,
  TTransactionClient = TClient,
> = Readonly<{
  name: string;
  client: TClient;
  transaction: DatabaseTransactionConfig<TClient, TTransactionClient>;
  healthCheck?: (client: TClient) => Promise<DatabaseHealth>;
  dispose?: (client: TClient) => Promise<void> | void;
}>;

export type DatabaseAdapter<
  TClient extends object,
  TTransactionClient = TClient,
> = DatabaseAdapterPort &
  Readonly<{
    client: TClient;
    withTransaction<TValue>(
      operation: (client: TTransactionClient) => Promise<TValue>,
    ): Promise<TValue>;
    getClient(transaction?: TransactionScope): TClient | TTransactionClient;
  }>;

export type DatabaseAdapterContract<TAdapter extends DatabaseAdapterPort = DatabaseAdapterPort> =
  Readonly<{
    name: string;
    createAdapter: () => TAdapter | Promise<TAdapter>;
  }>;
