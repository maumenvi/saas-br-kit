import type { TransactionManagerPort, TransactionScope } from "../core/index.ts";

export type CreatePassthroughTransactionManagerInput = Readonly<{
  idPrefix?: string;
  metadata?: Readonly<Record<string, unknown>>;
}>;

/**
 * Creates isolated transaction scopes without a concrete database dependency.
 */
export class PassthroughTransactionManager implements TransactionManagerPort {
  #nextId = 1;

  private readonly idPrefix: string;

  private readonly metadata?: Readonly<Record<string, unknown>>;

  /** Stores deterministic transaction options for tests. */
  constructor(input: CreatePassthroughTransactionManagerInput = {}) {
    this.idPrefix = input.idPrefix ?? "test_transaction";
    if (input.metadata !== undefined) {
      this.metadata = Object.freeze({ ...input.metadata });
    }
    Object.freeze(this);
  }

  /**
   * Runs the operation with a synthetic transaction scope.
   */
  runInTransaction<TValue>(
    operation: (transaction: TransactionScope) => Promise<TValue>,
  ): Promise<TValue> {
    const transaction = Object.freeze({
      id: `${this.idPrefix}_${this.#nextId}`,
      ...(this.metadata === undefined ? {} : { metadata: this.metadata }),
    });
    this.#nextId += 1;

    return operation(transaction);
  }
}

export function createPassthroughTransactionManager(
  input: CreatePassthroughTransactionManagerInput = {},
): TransactionManagerPort {
  return new PassthroughTransactionManager(input);
}
