import type {
  BillingProviderPort,
  CancelProviderSubscriptionInput,
  CreateProviderSubscriptionInput,
  CreateProviderSubscriptionOutput,
} from "#core";
import { fail, ok, type Result } from "#core";
import type { AsaasClient } from "../client/index.ts";
import { asaasErrorMapper, asaasSubscriptionMapper } from "../mappers/index.ts";

export type CreateAsaasBillingProviderInput = Readonly<{
  client: AsaasClient;
  billingType?: "BOLETO" | "CREDIT_CARD" | "PIX";
  nextDueDate?: (input: CreateProviderSubscriptionInput) => string;
}>;

/** Implements the Core billing provider port with Asaas subscriptions. */
export class AsaasBillingProvider implements BillingProviderPort {
  /** Payment provider key used by selection and persistence. */
  public readonly provider = "asaas";

  /** Capabilities supported by this v1 adapter. */
  public readonly capabilities = ["subscription"] as const;

  private readonly client: AsaasClient;

  private readonly billingType: "BOLETO" | "CREDIT_CARD" | "PIX" | undefined;

  private readonly nextDueDate: ((input: CreateProviderSubscriptionInput) => string) | undefined;

  /** Stores the Asaas client and v1 subscription options. */
  constructor(input: CreateAsaasBillingProviderInput) {
    this.client = input.client;
    this.billingType = input.billingType;
    this.nextDueDate = input.nextDueDate;
  }

  /** Creates an Asaas customer and subscription for a Core subscription. */
  async createCustomerAndSubscription(
    input: CreateProviderSubscriptionInput,
  ): Promise<Result<CreateProviderSubscriptionOutput>> {
    try {
      const customer = await this.client.createCustomer({
        name: input.customer.name,
        ...(input.customer.email === undefined ? {} : { email: input.customer.email }),
        ...(input.customer.document === undefined ? {} : { cpfCnpj: input.customer.document }),
        externalReference: input.organization.id,
      });
      const subscription = await this.client.createSubscription({
        customer: customer.id,
        billingType: asaasSubscriptionMapper.toBillingType(this.billingType),
        value: asaasSubscriptionMapper.toValue(input.plan),
        nextDueDate: this.resolveNextDueDate(input),
        cycle: asaasSubscriptionMapper.toCycle(input.plan),
        description: input.plan.name,
        externalReference: input.subscription.id,
      });

      return ok({
        providerCustomerId: customer.id,
        providerSubscriptionId: subscription.id,
        status: asaasSubscriptionMapper.toSubscriptionStatus(subscription),
      });
    } catch (error) {
      return fail(asaasErrorMapper.toCoreError(error));
    }
  }

  /** Cancels an Asaas subscription and normalizes provider failures. */
  async cancelSubscription(input: CancelProviderSubscriptionInput): Promise<Result<void>> {
    if (
      input.subscription.providerSubscriptionId === undefined ||
      this.client.cancelSubscription === undefined
    ) {
      return fail({
        kind: "external",
        code: "asaas.subscription_cancel_unsupported",
        message: "Asaas subscription cancellation is unavailable.",
      });
    }
    try {
      await this.client.cancelSubscription(input.subscription.providerSubscriptionId);
      return ok(undefined);
    } catch (error) {
      return fail(asaasErrorMapper.toCoreError(error));
    }
  }

  private resolveNextDueDate(input: CreateProviderSubscriptionInput): string {
    if (this.nextDueDate !== undefined) {
      return this.nextDueDate(input);
    }
    return input.requestedAt.slice(0, 10);
  }
}

/** Creates the Asaas billing provider port implementation. */
export function createAsaasBillingProvider(
  input: CreateAsaasBillingProviderInput,
): AsaasBillingProvider {
  return new AsaasBillingProvider(input);
}
