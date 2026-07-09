import type {
  AsaasClient,
  AsaasCustomer,
  AsaasCustomerInput,
  AsaasSubscription,
  AsaasSubscriptionInput,
} from "../client/index.ts";

/** In-memory Asaas client for adapter tests and examples. */
export class FakeAsaasClient implements AsaasClient {
  /** Customers created through the fake client. */
  public readonly customers: AsaasCustomer[] = [];

  /** Subscriptions created through the fake client. */
  public readonly subscriptions: AsaasSubscription[] = [];

  /** Stores a customer and returns a generated Asaas-like id. */
  async createCustomer(input: AsaasCustomerInput): Promise<AsaasCustomer> {
    const customer = {
      id: `cus_${this.customers.length + 1}`,
      name: input.name,
      ...(input.email === undefined ? {} : { email: input.email }),
      ...(input.cpfCnpj === undefined ? {} : { cpfCnpj: input.cpfCnpj }),
    };
    this.customers.push(customer);
    return customer;
  }

  /** Stores a subscription and returns a generated Asaas-like id. */
  async createSubscription(input: AsaasSubscriptionInput): Promise<AsaasSubscription> {
    const subscription = {
      id: `sub_${this.subscriptions.length + 1}`,
      customer: input.customer,
      status: "ACTIVE",
      value: input.value,
      cycle: input.cycle,
      nextDueDate: input.nextDueDate,
    };
    this.subscriptions.push(subscription);
    return subscription;
  }

  /** Marks a stored fake subscription as inactive. */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    const index = this.subscriptions.findIndex(
      (subscription) => subscription.id === subscriptionId,
    );
    const current = this.subscriptions[index];
    if (index < 0 || current === undefined) {
      throw new Error("Fake Asaas subscription was not found.");
    }
    this.subscriptions[index] = { ...current, status: "INACTIVE" };
  }

  /** No-op health check for tests. */
  async healthCheck(): Promise<void> {
    return undefined;
  }
}

/** Creates an in-memory Asaas client for tests. */
export function createFakeAsaasClient(): FakeAsaasClient {
  return new FakeAsaasClient();
}
