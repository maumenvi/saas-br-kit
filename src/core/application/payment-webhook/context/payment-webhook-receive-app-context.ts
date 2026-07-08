import type { AppContext } from "../../../context/app-context.ts";
import type {
  BillingWebhookVerifierPort,
  WebhookEventRepositoryPort,
} from "../../../ports/index.ts";

export type PaymentWebhookReceiveAppContext = AppContext &
  Readonly<{
    paymentWebhookVerifier: BillingWebhookVerifierPort;
    repositories: Readonly<{
      webhookEvents: WebhookEventRepositoryPort;
    }>;
  }>;
