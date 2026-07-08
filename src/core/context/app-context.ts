import type { ClockPort } from "../ports/clock.ts";
import type { IdGeneratorPort } from "../ports/id-generator.ts";
import type { LoggerPort } from "../ports/logger.ts";
import type { TransactionManagerPort } from "../ports/transaction-manager.ts";
import { consoleLogger, systemClock, uuidV7IdGenerator } from "./default-technical-ports.ts";

export type AppContextAdapters = Readonly<{
  database?: unknown;
  cache?: unknown;
  payments?: readonly unknown[];
  runtime?: unknown;
}>;

export type CreateSaasBrContextInput<TAdapters extends AppContextAdapters = AppContextAdapters> =
  Readonly<{
    clock?: ClockPort;
    idGenerator?: IdGeneratorPort;
    logger?: LoggerPort;
    transactionManager?: TransactionManagerPort;
    adapters?: TAdapters;
  }>;

/**
 * Holds long-lived technical dependencies and adapters for SDK use cases.
 */
export class SaasBrContext<TAdapters extends AppContextAdapters = AppContextAdapters> {
  /** Clock used by domain/application flows that need current time. */
  public readonly clock: ClockPort;

  /** Id generator used by use cases when creating entities. */
  public readonly idGenerator: IdGeneratorPort;

  /** Logger port used without binding the Core to a concrete logger. */
  public readonly logger: LoggerPort;

  /** Transaction manager shared by use cases that require atomic persistence. */
  public readonly transactionManager: TransactionManagerPort;

  /** External adapters available to the host application. */
  public readonly adapters: TAdapters;

  private constructor(input: Required<CreateSaasBrContextInput<TAdapters>>) {
    this.clock = input.clock;
    this.idGenerator = input.idGenerator;
    this.logger = input.logger;
    this.transactionManager = input.transactionManager;
    this.adapters = input.adapters;
    Object.freeze(this);
  }

  /**
   * Creates an immutable app context and infers transactions from the database adapter.
   */
  static create<TAdapters extends AppContextAdapters = AppContextAdapters>(
    input: CreateSaasBrContextInput<TAdapters>,
  ): SaasBrContext<TAdapters> {
    const transactionManager =
      input.transactionManager ??
      SaasBrContext.getDatabaseTransactionManager(input.adapters?.database);

    if (transactionManager === undefined) {
      throw new Error(
        "SaasBrContext.create requires transactionManager or adapters.database.transactionManager.",
      );
    }

    return new SaasBrContext({
      clock: input.clock ?? systemClock,
      idGenerator: input.idGenerator ?? uuidV7IdGenerator,
      logger: input.logger ?? consoleLogger,
      transactionManager,
      adapters: Object.freeze({
        ...(input.adapters?.database === undefined ? {} : { database: input.adapters.database }),
        ...(input.adapters?.cache === undefined ? {} : { cache: input.adapters.cache }),
        ...(input.adapters?.payments === undefined
          ? {}
          : { payments: Object.freeze([...input.adapters.payments]) }),
        ...(input.adapters?.runtime === undefined ? {} : { runtime: input.adapters.runtime }),
      }) as TAdapters,
    });
  }

  /**
   * Reads a transaction manager from a database adapter when it follows the SDK contract.
   */
  private static getDatabaseTransactionManager(
    database: unknown,
  ): TransactionManagerPort | undefined {
    if (typeof database !== "object" || database === null || !("transactionManager" in database)) {
      return undefined;
    }

    const transactionManager = (database as { transactionManager?: unknown }).transactionManager;

    if (
      typeof transactionManager === "object" &&
      transactionManager !== null &&
      "runInTransaction" in transactionManager &&
      typeof transactionManager.runInTransaction === "function"
    ) {
      return transactionManager as TransactionManagerPort;
    }

    return undefined;
  }
}

export type AppContext<TAdapters extends AppContextAdapters = AppContextAdapters> =
  SaasBrContext<TAdapters>;
