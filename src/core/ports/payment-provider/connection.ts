export type BillingProviderConnectionStatus = "active" | "inactive";

export type BillingProviderConnection = Readonly<{
  id: string;
  organizationId: string;
  provider: string;
  status: BillingProviderConnectionStatus;
  externalAccountId?: string;
}>;
