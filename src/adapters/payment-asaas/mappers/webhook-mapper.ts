import type { ParsedBillingWebhookEvent, SubscriptionStatus, WebhookEventPayload } from "#core";

type AsaasWebhookPayload = Readonly<{
  event?: string;
  payment?: Readonly<Record<string, unknown>>;
  subscription?: Readonly<Record<string, unknown>>;
}>;

/** Maps Asaas webhook payloads into SDK payment webhook events. */
export class AsaasWebhookMapper {
  /** Parses a raw SDK webhook payload into a normalized billing event. */
  toParsedEvent(rawPayload: WebhookEventPayload): ParsedBillingWebhookEvent {
    const payload = this.parsePayload(rawPayload);
    const subscription = payload.subscription ?? this.objectField(payload.payment, "subscription");
    const providerSubscriptionId = this.stringField(subscription, "id");

    if (providerSubscriptionId === undefined) {
      return { kind: "unknown", reason: "asaas.subscription_id_missing" };
    }
    const providerCustomerId = this.stringField(payload.payment, "customer");
    const occurredAt = this.stringField(payload.payment, "dateCreated");

    return {
      kind: "subscription_status_changed",
      providerSubscriptionId,
      status: this.toStatus(payload),
      ...(providerCustomerId === undefined ? {} : { providerCustomerId }),
      ...(occurredAt === undefined ? {} : { occurredAt }),
    };
  }

  private parsePayload(rawPayload: WebhookEventPayload): AsaasWebhookPayload {
    if (typeof rawPayload === "string") {
      return JSON.parse(rawPayload) as AsaasWebhookPayload;
    }
    return rawPayload as AsaasWebhookPayload;
  }

  private toStatus(payload: AsaasWebhookPayload): SubscriptionStatus {
    const event = payload.event ?? "";
    const paymentStatus = this.stringField(payload.payment, "status");
    const subscriptionStatus = this.stringField(payload.subscription, "status");

    if (event.includes("DELETED")) {
      return "canceled";
    }
    if (paymentStatus === "RECEIVED" || paymentStatus === "CONFIRMED") {
      return "active";
    }
    if (paymentStatus === "OVERDUE") {
      return "past_due";
    }
    if (subscriptionStatus === "ACTIVE") {
      return "active";
    }
    if (subscriptionStatus === "INACTIVE") {
      return "paused";
    }
    return "pending";
  }

  private objectField(
    value: Readonly<Record<string, unknown>> | undefined,
    field: string,
  ): Readonly<Record<string, unknown>> | undefined {
    const fieldValue = value?.[field];
    return typeof fieldValue === "object" && fieldValue !== null
      ? (fieldValue as Readonly<Record<string, unknown>>)
      : undefined;
  }

  private stringField(
    value: Readonly<Record<string, unknown>> | undefined,
    field: string,
  ): string | undefined {
    const fieldValue = value?.[field];
    return typeof fieldValue === "string" && fieldValue.length > 0 ? fieldValue : undefined;
  }
}

export const asaasWebhookMapper = new AsaasWebhookMapper();
