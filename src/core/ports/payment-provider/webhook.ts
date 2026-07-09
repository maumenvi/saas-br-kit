import type { ExecutionContext } from "../../context/execution-context.ts";
import type {
  SafeMetadata,
  SubscriptionStatus,
  WebhookEvent,
  WebhookEventPayload,
} from "../../domain/index.ts";
import type { CoreError, Result } from "../../errors/result.ts";
import type { BillingProviderConnection } from "./connection.ts";

export type BillingWebhookHeaders = Readonly<Record<string, string | readonly string[]>>;

export type BillingWebhookVerificationStatus = "verified" | "unsupported";

export type VerifyBillingWebhookInput = Readonly<{
  executionContext: ExecutionContext;
  provider: string;
  providerEventId: string;
  eventName: string;
  rawPayload: WebhookEventPayload;
  receivedAt: string;
  headers?: BillingWebhookHeaders;
  organizationId?: string;
  providerConnectionId?: string;
  providerAccountId?: string;
  connection?: BillingProviderConnection;
}>;

export type VerifyBillingWebhookOutput = Readonly<{
  status: BillingWebhookVerificationStatus;
  metadata?: SafeMetadata;
}>;

export type BillingWebhookVerifierPort = Readonly<{
  verify(input: VerifyBillingWebhookInput): Promise<Result<VerifyBillingWebhookOutput, CoreError>>;
}>;

export type SubscriptionWebhookStatusChanged = Readonly<{
  kind: "subscription_status_changed";
  providerSubscriptionId: string;
  status: SubscriptionStatus;
  providerCustomerId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  occurredAt?: string;
  metadata?: SafeMetadata;
}>;

export type UnknownBillingWebhook = Readonly<{
  kind: "unknown";
  reason?: string;
  metadata?: SafeMetadata;
}>;

export type ParsedBillingWebhookEvent = SubscriptionWebhookStatusChanged | UnknownBillingWebhook;

export type ParseBillingWebhookInput = Readonly<{
  executionContext: ExecutionContext;
  event: WebhookEvent;
}>;

export type BillingWebhookParserPort = Readonly<{
  parse(input: ParseBillingWebhookInput): Promise<Result<ParsedBillingWebhookEvent, CoreError>>;
}>;
