import type { DatabaseAdapterContract, DatabaseAdapterPort } from "./types.ts";

/**
 * Freezes one database adapter contract definition for runtime composition.
 */
export class DatabaseAdapterContractDefinition<
  TAdapter extends DatabaseAdapterPort = DatabaseAdapterPort,
> implements DatabaseAdapterContract<TAdapter>
{
  /** Adapter contract name used for registration and diagnostics. */
  public readonly name: string;

  /** Factory that resolves the concrete adapter implementation. */
  public readonly createAdapter: () => TAdapter | Promise<TAdapter>;

  /** Stores and freezes contract metadata for external adapter packages. */
  constructor(contract: DatabaseAdapterContract<TAdapter>) {
    this.name = contract.name;
    this.createAdapter = contract.createAdapter;

    Object.freeze(this);
  }
}
