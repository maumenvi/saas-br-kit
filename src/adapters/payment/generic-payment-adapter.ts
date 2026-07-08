import type {
  CreatePaymentAdapterInput,
  PaymentAdapter,
  PaymentProviderDescriptor,
  PaymentProviderHealth,
} from "./types.ts";

/**
 * Stores a generic payment client and immutable provider descriptor.
 */
export class GenericPaymentAdapter<TClient extends object> implements PaymentAdapter<TClient> {
  /** Adapter name exposed to diagnostics and runtime composition. */
  public readonly name: string;

  /** Native payment client preserved for external adapter code. */
  public readonly client: TClient;

  /** Provider capabilities advertised to payment routing code. */
  public readonly descriptor: PaymentProviderDescriptor;

  /** Optional health check bound to the native payment client. */
  public readonly healthCheck?: () => Promise<PaymentProviderHealth>;

  /** Optional cleanup hook bound to the native payment client. */
  public readonly dispose?: () => Promise<void>;

  /** Stores adapter callbacks while preserving the native client. */
  constructor(input: CreatePaymentAdapterInput<TClient>) {
    this.name = input.name;
    this.client = input.client;
    this.descriptor = Object.freeze({
      provider: input.descriptor.provider,
      capabilities: Object.freeze([...input.descriptor.capabilities]),
    });

    if (input.healthCheck !== undefined) {
      const healthCheck = input.healthCheck;
      this.healthCheck = async () => healthCheck(this.client);
    }

    if (input.dispose !== undefined) {
      const dispose = input.dispose;
      this.dispose = async () => {
        await dispose(this.client);
      };
    }

    Object.freeze(this);
  }
}
