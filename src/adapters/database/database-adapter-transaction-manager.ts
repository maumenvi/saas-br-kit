import type { TransactionManagerPort, TransactionScope } from "../../core/index.ts";

type ManagedTransactionRunner = <TValue>(
  operation: (transaction: TransactionScope) => Promise<TValue>,
) => Promise<TValue>;

/**
 * Bridges the generic database adapter with the Core transaction manager port.
 */
export class DatabaseAdapterTransactionManager implements TransactionManagerPort {
  private readonly runManagedTransaction: ManagedTransactionRunner;

  /** Stores the transaction runner supplied by the owning adapter. */
  constructor(runManagedTransaction: ManagedTransactionRunner) {
    this.runManagedTransaction = runManagedTransaction;
    Object.freeze(this);
  }

  /**
   * Runs a unit of work inside a transaction scope tracked by the adapter.
   */
  runInTransaction<TValue>(
    operation: (transaction: TransactionScope) => Promise<TValue>,
  ): Promise<TValue> {
    return this.runManagedTransaction(operation);
  }
}
