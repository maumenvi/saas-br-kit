import type { CorePort } from "./port.ts";
import type { CorePortRegistry } from "./registry.ts";

export type CoreContextFragment = Readonly<Record<string, unknown>>;

export type InstalledCoreRegistration<TContext extends CoreContextFragment, TOutput> = Readonly<{
  context: TContext;
  output: TOutput;
  dispose?: () => Promise<void> | void;
}>;

export type CreateCoreRegistrationInput<
  TName extends string,
  TContext extends CoreContextFragment,
  TOutput,
> = Readonly<{
  name: TName;
  requires?: readonly CorePort<unknown>[];
  provides?: readonly CorePort<unknown>[];
  install: (
    registry: CorePortRegistry,
  ) =>
    | InstalledCoreRegistration<TContext, TOutput>
    | Promise<InstalledCoreRegistration<TContext, TOutput>>;
}>;

/** Defines one immutable and dependency-aware Core composition unit. */
export class CoreRegistration<
  TName extends string,
  TContext extends CoreContextFragment = CoreContextFragment,
  TOutput = unknown,
> {
  /** Unique output and diagnostic name. */
  public readonly name: TName;

  /** Ports that must exist before installation. */
  public readonly requires: readonly CorePort<unknown>[];

  /** Ports that this registration guarantees to provide. */
  public readonly provides: readonly CorePort<unknown>[];

  private readonly installer: CreateCoreRegistrationInput<TName, TContext, TOutput>["install"];

  /** Stores a frozen registration definition. */
  constructor(input: CreateCoreRegistrationInput<TName, TContext, TOutput>) {
    this.name = input.name;
    this.requires = Object.freeze([...(input.requires ?? [])]);
    this.provides = Object.freeze([...(input.provides ?? [])]);
    this.installer = input.install;
    Object.freeze(this);
  }

  /** Installs the registration into a fresh build registry. */
  install(registry: CorePortRegistry): Promise<InstalledCoreRegistration<TContext, TOutput>> {
    return Promise.resolve(this.installer(registry));
  }
}
