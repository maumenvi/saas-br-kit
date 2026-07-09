import type { AppContext } from "../../../context/app-context.ts";
import type {
  BillingEventRepositoryPort,
  BillingWebhookParserPort,
  SubscriptionWebhookRepositoryPort,
  WebhookEventRepositoryPort,
} from "../../../ports/index.ts";

export type PaymentWebhookProcessAppContext = AppContext &
  Readonly<{
    paymentWebhookParser: BillingWebhookParserPort;
    repositories: Readonly<{
      webhookEvents: WebhookEventRepositoryPort;
      subscriptions: SubscriptionWebhookRepositoryPort;
      billingEvents: BillingEventRepositoryPort;
    }>;
  }>;
