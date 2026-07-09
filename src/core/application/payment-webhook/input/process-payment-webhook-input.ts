export type ProcessPaymentWebhookInput = Readonly<{
  webhookEventId: string;
  allowReprocess?: boolean;
}>;
