import type {
  AppContext,
  AppContextAdapters,
  CreateSaasBrContextInput,
} from "../context/app-context.ts";
import { SaasBrContext } from "../context/app-context.ts";
import { CoreContextMerger } from "./context-merger.ts";
import { CoreBuildError } from "./errors.ts";
import type { CoreContextFragment } from "./registration.ts";

export type BuiltCoreContext<TContext extends CoreContextFragment> = AppContext & TContext;

/** Converts registration fragments into one immutable Core application context. */
export class CoreContextAssembler {
  /** Merges fragments and delegates technical defaults to SaasBrContext. */
  assemble<TContext extends CoreContextFragment>(
    fragments: readonly CoreContextFragment[],
  ): BuiltCoreContext<TContext> {
    const merged = new CoreContextMerger().merge(fragments);
    const technical = this.requiredTechnicalPorts(merged);
    const base = SaasBrContext.create({
      ...technical,
      adapters: (merged.adapters ?? {}) as AppContextAdapters,
    });
    const {
      adapters: _adapters,
      clock: _clock,
      idGenerator: _idGenerator,
      logger: _logger,
      transactionManager: _transactionManager,
      ...application
    } = merged;
    return Object.freeze({ ...base, ...application }) as BuiltCoreContext<TContext>;
  }

  private requiredTechnicalPorts(
    context: Readonly<Record<string, unknown>>,
  ): CreateSaasBrContextInput<AppContextAdapters> {
    const clock = context.clock;
    const idGenerator = context.idGenerator;
    const logger = context.logger;
    const transactionManager = context.transactionManager;
    if (
      clock === undefined ||
      idGenerator === undefined ||
      logger === undefined ||
      transactionManager === undefined
    ) {
      throw new CoreBuildError([
        "Technical ports are required: clock, idGenerator, logger and transactionManager.",
      ]);
    }
    return {
      clock: clock as CreateSaasBrContextInput<AppContextAdapters>["clock"],
      idGenerator: idGenerator as CreateSaasBrContextInput<AppContextAdapters>["idGenerator"],
      logger: logger as CreateSaasBrContextInput<AppContextAdapters>["logger"],
      transactionManager:
        transactionManager as CreateSaasBrContextInput<AppContextAdapters>["transactionManager"],
    };
  }
}
