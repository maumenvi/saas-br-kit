import type { PaymentAdapterContract, PaymentProviderPort } from "./types.ts";

/**
 * Freezes one payment adapter contract definition for runtime composition.
 */
export class PaymentAdapterContractDefinition<
  TAdapter extends PaymentProviderPort = PaymentProviderPort,
> implements PaymentAdapterContract<TAdapter>
{
  /** Adapter contract name used for registration and diagnostics. */
  public readonly name: string;

  /** Factory that resolves the concrete payment provider implementation. */
  public readonly createProvider: () => TAdapter | Promise<TAdapter>;

  /** Stores and freezes contract metadata for external adapter packages. */
  constructor(contract: PaymentAdapterContract<TAdapter>) {
    this.name = contract.name;
    this.createProvider = contract.createProvider;

    Object.freeze(this);
  }
}
