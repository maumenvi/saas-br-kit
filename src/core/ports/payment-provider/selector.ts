import type { CoreError, Result } from "../../errors/result.ts";
import type { BillingProviderConnection } from "./connection.ts";
import type { BillingProviderCapability, BillingProviderPort } from "./provider.ts";

export type SelectedBillingProvider = Readonly<{
  connection: BillingProviderConnection;
  provider: BillingProviderPort;
}>;

export type SelectBillingProviderInput = Readonly<{
  organizationId: string;
  capability: BillingProviderCapability;
  requestedProvider?: string;
}>;

export type BillingProviderSelectorPort = Readonly<{
  selectProvider(
    input: SelectBillingProviderInput,
  ): Promise<Result<SelectedBillingProvider, CoreError>>;
}>;
