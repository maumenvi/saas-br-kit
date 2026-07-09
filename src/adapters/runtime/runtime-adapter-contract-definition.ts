import type { RuntimeAdapterContract, RuntimeAdapterPort } from "./types.ts";

/**
 * Freezes one runtime adapter contract definition for runtime composition.
 */
export class RuntimeAdapterContractDefinition<
  TAdapter extends RuntimeAdapterPort = RuntimeAdapterPort,
> implements RuntimeAdapterContract<TAdapter>
{
  /** Adapter contract name used for registration and diagnostics. */
  public readonly name: string;

  /** Factory that resolves the concrete runtime adapter implementation. */
  public readonly createAdapter: () => TAdapter | Promise<TAdapter>;

  /** Stores and freezes contract metadata for external adapter packages. */
  constructor(contract: RuntimeAdapterContract<TAdapter>) {
    this.name = contract.name;
    this.createAdapter = contract.createAdapter;

    Object.freeze(this);
  }
}
