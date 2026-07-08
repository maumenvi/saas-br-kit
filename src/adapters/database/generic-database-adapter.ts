import type { TransactionManagerPort, TransactionScope } from "../../core/index.ts";
import { DatabaseAdapterTransactionManager } from "./database-adapter-transaction-manager.ts";
import type {
  CreateDatabaseAdapterInput,
  DatabaseAdapter,
  DatabaseHealth,
  DatabaseTransactionConfig,
} from "./types.ts";

/**
 * Stores a generic database client and exposes Core transaction integration.
 */
export class GenericDatabaseAdapter<TClient extends object, TTransactionClient = TClient>
  implements DatabaseAdapter<TClient, TTransactionClient>
{
  /** Adapter name exposed to diagnostics and runtime composition. */
  public readonly name: string;

  /** Native database client preserved for external adapter code. */
  public readonly client: TClient;

  /** Transaction manager consumed by Core use cases. */
  public readonly transactionManager: TransactionManagerPort;

  /** Optional health check bound to the native database client. */
  public readonly healthCheck?: () => Promise<DatabaseHealth>;

  /** Optional cleanup hook bound to the native database client. */
  public readonly dispose?: () => Promise<void>;

  readonly #activeTransactions = new Map<string, TTransactionClient>();

  #nextTransactionId = 1;

  private readonly transaction: DatabaseTransactionConfig<TClient, TTransactionClient>;

  /** Stores adapter callbacks while preserving the native client. */
  constructor(input: CreateDatabaseAdapterInput<TClient, TTransactionClient>) {
    this.name = input.name;
    this.client = input.client;
    this.transaction = input.transaction;
    this.transactionManager = new DatabaseAdapterTransactionManager((operation) =>
      this.runInManagedTransaction(operation),
    );

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
   * Runs a callback with the concrete transaction client.
   */
  withTransaction<TValue>(
    operation: (client: TTransactionClient) => Promise<TValue>,
  ): Promise<TValue> {
    return this.transaction.run<TValue>(this.client, operation);
  }

  /**
   * Returns the root client or the client associated with an active transaction scope.
   */
  getClient(transaction?: TransactionScope): TClient | TTransactionClient {
    if (transaction === undefined) {
      return this.client;
    }

    const client = this.#activeTransactions.get(transaction.id);

    if (client === undefined) {
      throw new Error("Transaction scope is not active for this database adapter.");
    }

    return client;
  }

  private runInManagedTransaction<TValue>(
    operation: (transaction: TransactionScope) => Promise<TValue>,
  ): Promise<TValue> {
    return this.transaction.run<TValue>(this.client, async (client) => {
      const transaction: TransactionScope = {
        id: `${this.name}_${this.#nextTransactionId}`,
      };
      this.#nextTransactionId += 1;
      this.#activeTransactions.set(transaction.id, client);

      try {
        return await operation(transaction);
      } finally {
        this.#activeTransactions.delete(transaction.id);
      }
    });
  }
}
