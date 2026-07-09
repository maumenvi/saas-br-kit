import type {
  BillingProviderSelectorPort,
  BillingWebhookParserPort,
  BillingWebhookVerifierPort,
} from "../../ports/index.ts";
import { CorePort } from "../port.ts";

export const billingProviderSelectorCorePort = new CorePort<BillingProviderSelectorPort>({
  id: "billing.provider-selector",
  description: "BillingProviderSelectorPort that chooses a provider for one organization.",
});

export const billingWebhookVerifierCorePort = new CorePort<BillingWebhookVerifierPort>({
  id: "billing.webhook-verifier",
  description: "BillingWebhookVerifierPort that authenticates payment webhooks.",
});

export const billingWebhookParserCorePort = new CorePort<BillingWebhookParserPort>({
  id: "billing.webhook-parser",
  description: "BillingWebhookParserPort that normalizes payment webhook events.",
});
