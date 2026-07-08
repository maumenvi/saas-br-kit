export type AsaasBillingType = "BOLETO" | "CREDIT_CARD" | "PIX";

export type AsaasCycle =
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "SEMIANNUALLY"
  | "YEARLY";

export type AsaasCustomerInput = Readonly<{
  name: string;
  email?: string;
  cpfCnpj?: string;
  externalReference?: string;
}>;

export type AsaasCustomer = Readonly<{
  id: string;
  name?: string;
  email?: string;
  cpfCnpj?: string;
}>;

export type AsaasSubscriptionInput = Readonly<{
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  nextDueDate: string;
  cycle: AsaasCycle;
  description?: string;
  externalReference?: string;
}>;

export type AsaasSubscription = Readonly<{
  id: string;
  customer: string;
  status?: string;
  value?: number;
  cycle?: string;
  nextDueDate?: string;
}>;

export type AsaasClient = Readonly<{
  createCustomer(input: AsaasCustomerInput): Promise<AsaasCustomer>;
  createSubscription(input: AsaasSubscriptionInput): Promise<AsaasSubscription>;
  cancelSubscription?(subscriptionId: string): Promise<void>;
  healthCheck?(): Promise<void>;
}>;
