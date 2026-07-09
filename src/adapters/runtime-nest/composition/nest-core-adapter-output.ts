import type { DynamicModule } from "@nestjs/common";
import type { GenericRuntimeAdapter } from "#adapters/runtime";
import type { BuiltCoreContext, CoreContextFragment } from "#core";
import type { SaasBrNestAppContext, SaasBrNestOptions } from "../module/options.ts";
import { SaasBrModule } from "../module/saas-br.module.ts";
import type { NestRuntimeClient } from "../nest-runtime-adapter.ts";

/** Exposes Nest module creation after the immutable Core application is built. */
export class NestCoreAdapterOutput {
  /** Runtime descriptor registered in the Core context. */
  public readonly runtime: GenericRuntimeAdapter<NestRuntimeClient>;

  private readonly options: Omit<SaasBrNestOptions, "appContext">;

  /** Stores runtime configuration without requiring an app context early. */
  constructor(
    runtime: GenericRuntimeAdapter<NestRuntimeClient>,
    options: Omit<SaasBrNestOptions, "appContext">,
  ) {
    this.runtime = runtime;
    this.options = Object.freeze({ ...options });
    Object.freeze(this);
  }

  /** Creates validated Nest options from the final composed context. */
  createOptions<TContext extends CoreContextFragment>(
    appContext: BuiltCoreContext<TContext>,
  ): SaasBrNestOptions {
    return Object.freeze({
      ...this.options,
      appContext: appContext as unknown as SaasBrNestAppContext,
    });
  }

  /** Creates the dynamic Nest module for the final composed context. */
  createModule<TContext extends CoreContextFragment>(
    appContext: BuiltCoreContext<TContext>,
  ): DynamicModule {
    return SaasBrModule.forRoot(this.createOptions(appContext));
  }
}
