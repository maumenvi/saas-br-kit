import { SaasBrApplication } from "./application.ts";
import { CoreContextAssembler } from "./context-assembler.ts";
import { CoreBuildError, CoreCompositionError } from "./errors.ts";
import {
  clockCorePort,
  idGeneratorCorePort,
  loggerCorePort,
  transactionManagerCorePort,
} from "./ports/index.ts";
import type { CoreContextFragment, CoreRegistration } from "./registration.ts";
import { CorePortRegistry } from "./registry.ts";
import { CoreRegistrationResolver } from "./resolver.ts";

type AddedOutput<TName extends string, TOutput> = Readonly<Record<TName, TOutput>>;

/** Persistently composes Core properties and adapters without mutating prior instances. */
export class SaasBrCore<
  TContext extends CoreContextFragment = Record<never, never>,
  TOutputs extends object = Record<never, never>,
> {
  private readonly registrations: readonly CoreRegistration<string, CoreContextFragment, unknown>[];

  private constructor(
    registrations: readonly CoreRegistration<string, CoreContextFragment, unknown>[],
  ) {
    this.registrations = Object.freeze([...registrations]);
    Object.freeze(this);
  }

  /** Creates an empty immutable composer. */
  static create(): SaasBrCore {
    return new SaasBrCore([]);
  }

  /** Returns a new composer containing one additional registration. */
  add<TName extends string, TAddedContext extends CoreContextFragment, TOutput>(
    registration: CoreRegistration<TName, TAddedContext, TOutput>,
  ): SaasBrCore<TContext & TAddedContext, TOutputs & AddedOutput<TName, TOutput>> {
    if (this.registrations.some((current) => current.name === registration.name)) {
      throw new CoreCompositionError(
        "core.registration_duplicate",
        `Registration "${registration.name}" was added more than once.`,
      );
    }
    return new SaasBrCore([...this.registrations, registration]) as SaasBrCore<
      TContext & TAddedContext,
      TOutputs & AddedOutput<TName, TOutput>
    >;
  }

  /** Builds a fresh registry, validates required ports and freezes the resulting application. */
  async build(): Promise<SaasBrApplication<TContext, TOutputs>> {
    const registry = new CorePortRegistry();
    const resolved = await new CoreRegistrationResolver().resolve(this.registrations, registry);
    this.validateTechnicalPorts(registry);
    const appContext = new CoreContextAssembler().assemble<TContext>(
      resolved.map((item) => item.context),
    );
    const outputs = Object.fromEntries(
      resolved.map((item) => [item.registration.name, item.output]),
    ) as TOutputs;
    return new SaasBrApplication({
      appContext,
      outputs,
      disposers: resolved.flatMap((item) => (item.dispose === undefined ? [] : [item.dispose])),
    });
  }

  private validateTechnicalPorts(registry: CorePortRegistry): void {
    const missing = [
      clockCorePort,
      idGeneratorCorePort,
      loggerCorePort,
      transactionManagerCorePort,
    ].filter((port) => !registry.has(port));
    if (missing.length > 0) {
      throw new CoreBuildError(
        missing.map((port) => `${port.id} is required: ${port.description}`),
      );
    }
  }
}
