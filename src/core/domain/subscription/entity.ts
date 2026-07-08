import { fail, type Result } from "../../errors/result.ts";
import type { OrganizationId, PlanId, SubscriptionId } from "../index.ts";
import type { SafeMetadata } from "../metadata/index.ts";
import type { TimestampInput } from "../validation/index.ts";
import { createDomainValidationError } from "../validation/index.ts";
import { subscriptionBuilder } from "./builder.ts";
import { subscriptionAccessPolicy } from "./policy.ts";
import type { SubscriptionStatus } from "./status.ts";
import type {
  ApplyProviderSubscriptionInput,
  ApplyWebhookSubscriptionStatusInput,
  CreateSubscriptionEntityInput,
  MarkSubscriptionProviderFailureInput,
  SubscriptionAccessDecision,
  SubscriptionProps,
} from "./types.ts";

/**
 * Represents a provider-backed subscription for one organization and plan.
 */
export class Subscription {
  /** Subscription identifier used by repositories and events. */
  public readonly id: SubscriptionId;

  /** Tenant that owns this subscription. */
  public readonly organizationId: OrganizationId;

  /** Actor that owns or initiated this subscription. */
  public readonly userId?: string;

  /** Optional organization customer linked to this subscription. */
  public readonly customerId?: string;

  /** Plan currently attached to this subscription. */
  public readonly planId: PlanId;

  /** Normalized lifecycle status. */
  public readonly status: SubscriptionStatus;

  /** Payment provider key that owns the external subscription. */
  public readonly provider: string;

  /** Provider connection used for this subscription. */
  public readonly providerConnectionId: string;

  /** Optional external customer identifier. */
  public readonly providerCustomerId?: string;

  /** Optional external subscription identifier. */
  public readonly providerSubscriptionId?: string;

  /** Optional ISO timestamp when the active period starts. */
  public readonly currentPeriodStart?: string;

  /** Optional ISO timestamp when the active period ends. */
  public readonly currentPeriodEnd?: string;

  /** ISO timestamp for entity creation. */
  public readonly createdAt: string;

  /** ISO timestamp for the last entity update. */
  public readonly updatedAt: string;

  /** Optional safe metadata for subscription-specific extension data. */
  public readonly metadata?: SafeMetadata;

  /** Stores normalized subscription properties immutably. */
  constructor(props: SubscriptionProps) {
    this.id = props.id;
    this.organizationId = props.organizationId;
    if (props.userId !== undefined) {
      this.userId = props.userId;
    }
    if (props.customerId !== undefined) {
      this.customerId = props.customerId;
    }
    this.planId = props.planId;
    this.status = props.status;
    this.provider = props.provider;
    this.providerConnectionId = props.providerConnectionId;
    if (props.providerCustomerId !== undefined) {
      this.providerCustomerId = props.providerCustomerId;
    }
    if (props.providerSubscriptionId !== undefined) {
      this.providerSubscriptionId = props.providerSubscriptionId;
    }
    if (props.currentPeriodStart !== undefined) {
      this.currentPeriodStart = props.currentPeriodStart;
    }
    if (props.currentPeriodEnd !== undefined) {
      this.currentPeriodEnd = props.currentPeriodEnd;
    }
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    if (props.metadata !== undefined) {
      this.metadata = props.metadata;
    }
    Object.freeze(this);
  }

  /**
   * Creates a subscription after validating tenant, provider and period fields.
   */
  static create(input: CreateSubscriptionEntityInput): Result<Subscription> {
    return subscriptionBuilder.build(input);
  }

  /**
   * Applies successful provider identifiers and status to this subscription.
   */
  applyProvider(input: ApplyProviderSubscriptionInput): Result<Subscription> {
    if (input.providerCustomerId.trim().length === 0) {
      return fail(
        createDomainValidationError(
          "subscription.providerCustomerId.invalid",
          "subscription.providerCustomerId is required.",
        ),
      );
    }

    if (input.providerSubscriptionId.trim().length === 0) {
      return fail(
        createDomainValidationError(
          "subscription.providerSubscriptionId.invalid",
          "subscription.providerSubscriptionId is required.",
        ),
      );
    }

    return subscriptionBuilder.build({
      id: this.id,
      organizationId: this.organizationId,
      ...(this.userId === undefined ? {} : { userId: this.userId }),
      ...(this.customerId === undefined ? {} : { customerId: this.customerId }),
      planId: this.planId,
      provider: this.provider,
      providerConnectionId: this.providerConnectionId,
      providerCustomerId: input.providerCustomerId,
      providerSubscriptionId: input.providerSubscriptionId,
      status: input.status,
      ...(input.currentPeriodStart === undefined
        ? {}
        : { currentPeriodStart: input.currentPeriodStart }),
      ...(input.currentPeriodEnd === undefined ? {} : { currentPeriodEnd: input.currentPeriodEnd }),
      createdAt: this.createdAt,
      updatedAt: input.updatedAt,
      ...(this.metadata === undefined ? {} : { metadata: this.metadata }),
    });
  }

  /**
   * Marks this subscription as incomplete after a provider failure.
   */
  markProviderFailure(input: MarkSubscriptionProviderFailureInput): Result<Subscription> {
    return subscriptionBuilder.build({
      id: this.id,
      organizationId: this.organizationId,
      ...(this.userId === undefined ? {} : { userId: this.userId }),
      ...(this.customerId === undefined ? {} : { customerId: this.customerId }),
      planId: this.planId,
      provider: this.provider,
      providerConnectionId: this.providerConnectionId,
      status: "incomplete",
      createdAt: this.createdAt,
      updatedAt: input.updatedAt,
      ...(this.metadata === undefined ? {} : { metadata: this.metadata }),
    });
  }

  /**
   * Applies a normalized webhook status while preserving existing provider ids by default.
   */
  applyWebhookStatus(input: ApplyWebhookSubscriptionStatusInput): Result<Subscription> {
    return subscriptionBuilder.build({
      id: this.id,
      organizationId: this.organizationId,
      ...(this.userId === undefined ? {} : { userId: this.userId }),
      ...(this.customerId === undefined ? {} : { customerId: this.customerId }),
      planId: this.planId,
      provider: this.provider,
      providerConnectionId: this.providerConnectionId,
      status: input.status,
      ...(input.providerCustomerId === undefined
        ? this.providerCustomerId === undefined
          ? {}
          : { providerCustomerId: this.providerCustomerId }
        : { providerCustomerId: input.providerCustomerId }),
      ...(input.providerSubscriptionId === undefined
        ? this.providerSubscriptionId === undefined
          ? {}
          : { providerSubscriptionId: this.providerSubscriptionId }
        : { providerSubscriptionId: input.providerSubscriptionId }),
      ...(input.currentPeriodStart === undefined
        ? this.currentPeriodStart === undefined
          ? {}
          : { currentPeriodStart: this.currentPeriodStart }
        : { currentPeriodStart: input.currentPeriodStart }),
      ...(input.currentPeriodEnd === undefined
        ? this.currentPeriodEnd === undefined
          ? {}
          : { currentPeriodEnd: this.currentPeriodEnd }
        : { currentPeriodEnd: input.currentPeriodEnd }),
      createdAt: this.createdAt,
      updatedAt: input.updatedAt,
      ...(this.metadata === undefined ? {} : { metadata: this.metadata }),
    });
  }

  /**
   * Returns whether the subscription can still be considered current.
   */
  isOpen(): boolean {
    return !["canceled", "expired"].includes(this.status);
  }

  /**
   * Evaluates whether a subscription grants access at a given instant.
   */
  static decideAccess(
    input: Readonly<{
      subscription: Subscription | null;
      at: TimestampInput;
    }>,
  ): Result<SubscriptionAccessDecision> {
    return subscriptionAccessPolicy.decide(input);
  }

  /**
   * Returns an open subscription or a domain error when access cannot proceed.
   */
  static requireOpen(subscription: Subscription | null): Result<Subscription> {
    return subscriptionAccessPolicy.requireOpen(subscription);
  }
}
