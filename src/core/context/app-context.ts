import { CoreFunctionalityNotConfiguredError } from "../errors/index.ts";
import type { ClockPort } from "../ports/clock.ts";
import type { IdGeneratorPort } from "../ports/id-generator.ts";
import type { LoggerPort } from "../ports/logger.ts";
import type { TransactionManagerPort } from "../ports/transaction-manager.ts";

export type AppContextAdapters = Readonly<{
  database?: unknown;
  cache?: unknown;
  payments?: readonly unknown[];
  runtime?: unknown;
}>;

export type CreateSaasBrContextInput<TAdapters extends AppContextAdapters = AppContextAdapters> =
  Readonly<{
    clock: ClockPort;
    idGenerator: IdGeneratorPort;
    logger: LoggerPort;
    transactionManager: TransactionManagerPort;
    adapters?: TAdapters;
  }>;

type RuntimeFunctionalityFallbacks = Readonly<{
  paymentProviderSelector?: unknown;
  paymentWebhookParser?: unknown;
  paymentWebhookVerifier?: unknown;
  repositories?: unknown;
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

  /** Repository container used by persistence-backed use cases. */
  public readonly repositories?: unknown;

  /** Billing provider selector used by subscription use cases. */
  public readonly paymentProviderSelector?: unknown;

  /** Webhook verifier used by payment webhook receive flows. */
  public readonly paymentWebhookVerifier?: unknown;

  /** Webhook parser used by payment webhook processing flows. */
  public readonly paymentWebhookParser?: unknown;

  private constructor(
    input: Required<CreateSaasBrContextInput<TAdapters>> & RuntimeFunctionalityFallbacks,
  ) {
    this.clock = input.clock;
    this.idGenerator = input.idGenerator;
    this.logger = input.logger;
    this.transactionManager = input.transactionManager;
    this.adapters = input.adapters;
    this.repositories =
      input.repositories ?? SaasBrContext.createMissingFunctionalityProxy("repositories");
    this.paymentProviderSelector =
      input.paymentProviderSelector ??
      SaasBrContext.createMissingFunctionalityProxy("paymentProviderSelector");
    this.paymentWebhookVerifier =
      input.paymentWebhookVerifier ??
      SaasBrContext.createMissingFunctionalityProxy("paymentWebhookVerifier");
    this.paymentWebhookParser =
      input.paymentWebhookParser ??
      SaasBrContext.createMissingFunctionalityProxy("paymentWebhookParser");
    Object.freeze(this);
  }

  /**
   * Creates an immutable app context and infers transactions from the database adapter.
   */
  static create<TAdapters extends AppContextAdapters = AppContextAdapters>(
    input: CreateSaasBrContextInput<TAdapters>,
  ): SaasBrContext<TAdapters> {
    if (input.clock === undefined) {
      throw new CoreFunctionalityNotConfiguredError("clock");
    }
    if (input.idGenerator === undefined) {
      throw new CoreFunctionalityNotConfiguredError("idGenerator");
    }
    if (input.logger === undefined) {
      throw new CoreFunctionalityNotConfiguredError("logger");
    }
    if (input.transactionManager === undefined) {
      throw new CoreFunctionalityNotConfiguredError("transactionManager");
    }

    return new SaasBrContext({
      clock: input.clock,
      idGenerator: input.idGenerator,
      logger: input.logger,
      transactionManager: input.transactionManager,
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

  private static createMissingFunctionalityProxy(functionality: string): unknown {
    const target = Object.freeze(() => {
      throw new CoreFunctionalityNotConfiguredError(functionality);
    });
    return new Proxy(target, {
      apply: () => {
        throw new CoreFunctionalityNotConfiguredError(functionality);
      },
      get: (_target, property) => {
        if (property === "then") return undefined;
        if (property === "toString") return () => `[${functionality} not configured]`;
        const key =
          typeof property === "symbol" ? (property.description ?? property.toString()) : property;
        throw new CoreFunctionalityNotConfiguredError(`${functionality}.${key}`);
      },
    });
  }
}

export type AppContext<TAdapters extends AppContextAdapters = AppContextAdapters> =
  SaasBrContext<TAdapters>;
