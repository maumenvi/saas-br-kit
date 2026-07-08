import type {
  AppContext,
  AppContextAdapters,
  CreateSaasBrContextInput,
} from "../context/app-context.ts";
import { SaasBrContext } from "../context/app-context.ts";
import { CoreContextMerger } from "./context-merger.ts";
import type { CoreContextFragment } from "./registration.ts";

export type BuiltCoreContext<TContext extends CoreContextFragment> = AppContext & TContext;

/** Converts registration fragments into one immutable Core application context. */
export class CoreContextAssembler {
  /** Merges fragments and delegates technical defaults to SaasBrContext. */
  assemble<TContext extends CoreContextFragment>(
    fragments: readonly CoreContextFragment[],
  ): BuiltCoreContext<TContext> {
    const merged = new CoreContextMerger().merge(fragments);
    const base = SaasBrContext.create({
      ...this.optionalPort(merged, "clock"),
      ...this.optionalPort(merged, "idGenerator"),
      ...this.optionalPort(merged, "logger"),
      ...this.optionalPort(merged, "transactionManager"),
      adapters: (merged.adapters ?? {}) as AppContextAdapters,
    } as CreateSaasBrContextInput<AppContextAdapters>);
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

  private optionalPort(
    context: Readonly<Record<string, unknown>>,
    key: keyof CreateSaasBrContextInput,
  ): Readonly<Record<string, unknown>> {
    const value = context[key];
    return value === undefined ? {} : { [key]: value };
  }
}
