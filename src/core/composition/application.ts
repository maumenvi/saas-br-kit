import type { BuiltCoreContext } from "./context-assembler.ts";
import type { CoreContextFragment } from "./registration.ts";

const disposedApplications = new WeakSet<object>();

/** Holds one built immutable context and the typed outputs of its registrations. */
export class SaasBrApplication<
  TContext extends CoreContextFragment = CoreContextFragment,
  TOutputs extends object = object,
> {
  /** Fully assembled application context. */
  public readonly appContext: BuiltCoreContext<TContext>;

  /** Adapter-specific outputs keyed by registration name. */
  public readonly outputs: Readonly<TOutputs>;

  private readonly disposers: readonly (() => Promise<void> | void)[];

  /** Stores frozen build artifacts and lifecycle callbacks. */
  constructor(
    input: Readonly<{
      appContext: BuiltCoreContext<TContext>;
      outputs: TOutputs;
      disposers?: readonly (() => Promise<void> | void)[];
    }>,
  ) {
    this.appContext = input.appContext;
    this.outputs = Object.freeze({ ...input.outputs });
    this.disposers = Object.freeze([...(input.disposers ?? [])]);
    Object.freeze(this);
  }

  /** Disposes registrations once, in reverse installation order. */
  async dispose(): Promise<void> {
    if (disposedApplications.has(this)) return;
    disposedApplications.add(this);
    for (const dispose of [...this.disposers].reverse()) {
      await dispose();
    }
  }
}
