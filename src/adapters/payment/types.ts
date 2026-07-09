export type PaymentProviderCapability =
  | "subscription"
  | "pix"
  | "boleto"
  | "card"
  | "trial"
  | "cancelation"
  | "refund"
  | "webhook-verification";

export type PaymentProviderDescriptor = Readonly<{
  provider: string;
  capabilities: readonly PaymentProviderCapability[];
}>;

export type PaymentProviderHealthStatus = "up" | "down";

export type PaymentProviderHealth = Readonly<{
  status: PaymentProviderHealthStatus;
  details?: Readonly<Record<string, unknown>>;
}>;

export type PaymentProviderPort = Readonly<{
  name?: string;
  descriptor: PaymentProviderDescriptor;
  healthCheck?: () => Promise<PaymentProviderHealth>;
  dispose?: () => Promise<void> | void;
}>;

export type CreatePaymentAdapterInput<TClient extends object> = Readonly<{
  name: string;
  client: TClient;
  descriptor: PaymentProviderDescriptor;
  healthCheck?: (client: TClient) => Promise<PaymentProviderHealth>;
  dispose?: (client: TClient) => Promise<void> | void;
}>;

export type PaymentAdapter<TClient extends object> = PaymentProviderPort &
  Readonly<{
    name: string;
    client: TClient;
  }>;

export type PaymentAdapterContract<TAdapter extends PaymentProviderPort = PaymentProviderPort> =
  Readonly<{
    name: string;
    createProvider: () => TAdapter | Promise<TAdapter>;
  }>;
