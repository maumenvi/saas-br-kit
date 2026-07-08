import {
  type BillingProviderPort,
  type BillingProviderSelectorPort,
  createCoreError,
  fail,
  ok,
} from "#core";

/** Selects one configured Asaas provider for every supported organization. */
export class SingleAsaasProviderSelector implements BillingProviderSelectorPort {
  private readonly provider: BillingProviderPort;

  /** Stores the provider used by the single-provider composition preset. */
  constructor(provider: BillingProviderPort) {
    this.provider = provider;
    Object.freeze(this);
  }

  /** Selects Asaas or reports an unsupported requested provider. */
  async selectProvider(input: Parameters<BillingProviderSelectorPort["selectProvider"]>[0]) {
    if (
      (input.requestedProvider !== undefined &&
        input.requestedProvider !== this.provider.provider) ||
      !this.provider.capabilities.includes(input.capability)
    ) {
      return fail(
        createCoreError({
          kind: "not_found",
          code: "billing.provider_unavailable",
          message: "Requested billing provider is not available.",
        }),
      );
    }
    return ok(
      Object.freeze({
        connection: Object.freeze({
          id: `${this.provider.provider}_default`,
          organizationId: input.organizationId,
          provider: this.provider.provider,
          status: "active" as const,
        }),
        provider: this.provider,
      }),
    );
  }
}
