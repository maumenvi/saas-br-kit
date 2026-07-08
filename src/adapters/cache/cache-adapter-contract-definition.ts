import type { CacheAdapterContract, CacheAdapterPort } from "./types.ts";

/**
 * Freezes one cache adapter contract definition for runtime composition.
 */
export class CacheAdapterContractDefinition<TAdapter extends CacheAdapterPort = CacheAdapterPort>
  implements CacheAdapterContract<TAdapter>
{
  /** Adapter contract name used for registration and diagnostics. */
  public readonly name: string;

  /** Factory that resolves the concrete adapter implementation. */
  public readonly createAdapter: () => TAdapter | Promise<TAdapter>;

  /** Stores and freezes contract metadata for external adapter packages. */
  constructor(contract: CacheAdapterContract<TAdapter>) {
    this.name = contract.name;
    this.createAdapter = contract.createAdapter;

    Object.freeze(this);
  }
}
