import { ok, type Result } from "../../errors/result.ts";
import type { OrganizationId, WebhookEventId } from "../index.ts";
import type { SafeMetadata } from "../metadata/index.ts";
import { webhookEventFactory } from "./factory.ts";
import type { WebhookEventStatus } from "./status.ts";
import type {
  CreateWebhookEventEntityInput,
  WebhookEventPayload,
  WebhookEventProps,
} from "./types.ts";

/**
 * Represents a persisted payment webhook event and its processing state.
 */
export class WebhookEvent {
  /** Webhook event identifier used by repositories. */
  public readonly id: WebhookEventId;

  /** Payment provider that sent the event. */
  public readonly provider: string;

  /** Provider-side id used for idempotency. */
  public readonly providerEventId: string;

  /** Provider event name after minimal normalization. */
  public readonly eventName: string;

  /** Processing lifecycle status. */
  public readonly status: WebhookEventStatus;

  /** Raw payload stored for replay and analysis, never for logs. */
  public readonly rawPayload: WebhookEventPayload;

  /** ISO timestamp when the event was received. */
  public readonly receivedAt: string;

  /** ISO timestamp for the last state change. */
  public readonly updatedAt: string;

  /** Number of processing attempts already made. */
  public readonly processingAttempts: number;

  /** Optional tenant resolved from the webhook. */
  public readonly organizationId?: OrganizationId;

  /** Optional provider connection resolved from the webhook. */
  public readonly providerConnectionId?: string;

  /** Optional external provider account id. */
  public readonly providerAccountId?: string;

  /** Optional ISO timestamp when processing succeeded. */
  public readonly processedAt?: string;

  /** Optional ISO timestamp when processing failed. */
  public readonly failedAt?: string;

  /** Optional ISO timestamp when the event was marked unknown. */
  public readonly unknownAt?: string;

  /** Optional normalized error code from the last failure. */
  public readonly lastErrorCode?: string;

  /** Optional reason recorded when the event needs analysis. */
  public readonly analysisReason?: string;

  /** Optional safe metadata for replay or diagnostics. */
  public readonly metadata?: SafeMetadata;

  /** Stores normalized webhook event properties immutably. */
  private constructor(props: WebhookEventProps) {
    this.id = props.id;
    this.provider = props.provider;
    this.providerEventId = props.providerEventId;
    this.eventName = props.eventName;
    this.status = props.status;
    this.rawPayload = props.rawPayload;
    this.receivedAt = props.receivedAt;
    this.updatedAt = props.updatedAt;
    this.processingAttempts = props.processingAttempts;
    if (props.organizationId !== undefined) {
      this.organizationId = props.organizationId;
    }
    if (props.providerConnectionId !== undefined) {
      this.providerConnectionId = props.providerConnectionId;
    }
    if (props.providerAccountId !== undefined) {
      this.providerAccountId = props.providerAccountId;
    }
    if (props.processedAt !== undefined) {
      this.processedAt = props.processedAt;
    }
    if (props.failedAt !== undefined) {
      this.failedAt = props.failedAt;
    }
    if (props.unknownAt !== undefined) {
      this.unknownAt = props.unknownAt;
    }
    if (props.lastErrorCode !== undefined) {
      this.lastErrorCode = props.lastErrorCode;
    }
    if (props.analysisReason !== undefined) {
      this.analysisReason = props.analysisReason;
    }
    if (props.metadata !== undefined) {
      this.metadata = props.metadata;
    }
    Object.freeze(this);
  }

  /**
   * Creates a webhook event after validating idempotency keys, status and timestamps.
   */
  static create(input: CreateWebhookEventEntityInput): Result<WebhookEvent> {
    const props = webhookEventFactory.createProps(input);
    return props.ok ? ok(new WebhookEvent(props.data)) : props;
  }
}

/** Compatibility facade for legacy webhook event entity creation calls. */
export const createWebhookEventEntity = (
  input: CreateWebhookEventEntityInput,
): Result<WebhookEvent> => WebhookEvent.create(input);
