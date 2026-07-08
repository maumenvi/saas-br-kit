import {
  billingProviderSelectorCorePort,
  billingWebhookParserCorePort,
  billingWebhookVerifierCorePort,
  CoreRegistration,
  paymentAdapterCorePort,
} from "#core";
import { type AsaasPaymentAdapter, asaasPaymentAdapter } from "../asaas-payment-adapter.ts";
import type { AsaasClient } from "../client/index.ts";
import {
  type AsaasBillingProvider,
  type CreateAsaasBillingProviderInput,
  createAsaasBillingProvider,
} from "../provider/index.ts";
import {
  type AsaasWebhookParser,
  type AsaasWebhookVerifier,
  createAsaasWebhookParser,
  createAsaasWebhookVerifier,
} from "../webhook/index.ts";
import { SingleAsaasProviderSelector } from "./single-asaas-provider-selector.ts";

export type AsaasCoreAdapterInput = Readonly<{
  client: AsaasClient;
  webhookToken?: string;
  billingType?: CreateAsaasBillingProviderInput["billingType"];
  nextDueDate?: CreateAsaasBillingProviderInput["nextDueDate"];
}>;

export type AsaasCoreAdapterContext = Readonly<{
  adapters: Readonly<{ payments: readonly [AsaasPaymentAdapter] }>;
  paymentProviderSelector: SingleAsaasProviderSelector;
  paymentWebhookVerifier: AsaasWebhookVerifier;
  paymentWebhookParser: AsaasWebhookParser;
}>;

export type AsaasCoreAdapterOutput = Readonly<{
  payment: AsaasPaymentAdapter;
  billingProvider: AsaasBillingProvider;
  paymentProviderSelector: SingleAsaasProviderSelector;
  paymentWebhookVerifier: AsaasWebhookVerifier;
  paymentWebhookParser: AsaasWebhookParser;
}>;

/** Creates a complete single-provider Asaas registration for Core billing flows. */
export function asaasCoreAdapter(
  input: AsaasCoreAdapterInput,
): CoreRegistration<"asaas", AsaasCoreAdapterContext, AsaasCoreAdapterOutput> {
  const client = input.client;
  const webhookToken = input.webhookToken;
  const billingType = input.billingType;
  const nextDueDate = input.nextDueDate;
  return new CoreRegistration({
    name: "asaas",
    provides: [
      paymentAdapterCorePort,
      billingProviderSelectorCorePort,
      billingWebhookVerifierCorePort,
      billingWebhookParserCorePort,
    ],
    install: (registry) => {
      const payment = asaasPaymentAdapter(client);
      const billingProvider = createAsaasBillingProvider({
        client: payment.client,
        ...(billingType === undefined ? {} : { billingType }),
        ...(nextDueDate === undefined ? {} : { nextDueDate }),
      });
      const paymentProviderSelector = new SingleAsaasProviderSelector(billingProvider);
      const paymentWebhookVerifier = createAsaasWebhookVerifier({
        ...(webhookToken === undefined ? {} : { webhookToken }),
      });
      const paymentWebhookParser = createAsaasWebhookParser();
      registry.provide(paymentAdapterCorePort, payment);
      registry.provide(billingProviderSelectorCorePort, paymentProviderSelector);
      registry.provide(billingWebhookVerifierCorePort, paymentWebhookVerifier);
      registry.provide(billingWebhookParserCorePort, paymentWebhookParser);
      return {
        context: Object.freeze({
          adapters: Object.freeze({ payments: Object.freeze([payment] as const) }),
          paymentProviderSelector,
          paymentWebhookVerifier,
          paymentWebhookParser,
        }),
        output: Object.freeze({
          payment,
          billingProvider,
          paymentProviderSelector,
          paymentWebhookVerifier,
          paymentWebhookParser,
        }),
        ...(payment.dispose === undefined ? {} : { dispose: payment.dispose }),
      };
    },
  });
}
