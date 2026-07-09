import { ok, type Result } from "../../errors/result.ts";
import type { BillingEventId, OrganizationId, PlanId, SubscriptionId } from "../index.ts";
import type { SafeMetadata } from "../metadata/index.ts";
import { freezeSafeMetadata } from "../metadata/index.ts";
import {
  ensureAllowedString,
  normalizeRequiredText,
  normalizeTimestamp,
} from "../validation/index.ts";
import type { BillingEventType } from "./event-types.ts";
import { BILLING_EVENT_TYPES } from "./event-types.ts";
import type { BillingEventProps, CreateBillingEventEntityInput } from "./types.ts";

/**
 * Records a billing-relevant event for audit and operational flows.
 */
export class BillingEvent {
  /** Event identifier used by repositories. */
  public readonly id: BillingEventId;

  /** Normalized billing event type. */
  public readonly type: BillingEventType;

  /** ISO timestamp for when the event occurred. */
  public readonly occurredAt: string;

  /** Optional tenant related to the event. */
  public readonly organizationId?: OrganizationId;

  /** Optional plan related to the event. */
  public readonly planId?: PlanId;

  /** Optional subscription related to the event. */
  public readonly subscriptionId?: SubscriptionId;

  /** Optional safe metadata for event-specific context. */
  public readonly metadata?: SafeMetadata;

  /** Stores normalized billing event properties immutably. */
  private constructor(props: BillingEventProps) {
    this.id = props.id;
    this.type = props.type;
    this.occurredAt = props.occurredAt;
    if (props.organizationId !== undefined) {
      this.organizationId = props.organizationId;
    }
    if (props.planId !== undefined) {
      this.planId = props.planId;
    }
    if (props.subscriptionId !== undefined) {
      this.subscriptionId = props.subscriptionId;
    }
    if (props.metadata !== undefined) {
      this.metadata = props.metadata;
    }
    Object.freeze(this);
  }

  /**
   * Creates a billing event after validating type and timestamp.
   */
  static create(input: CreateBillingEventEntityInput): Result<BillingEvent> {
    const id = normalizeRequiredText("billingEvent.id", input.id, { maxLength: 120 });
    if (!id.ok) {
      return id;
    }

    const type = ensureAllowedString("billingEvent.type", input.type, BILLING_EVENT_TYPES);
    if (!type.ok) {
      return type;
    }

    const occurredAt = normalizeTimestamp("billingEvent.occurredAt", input.occurredAt);
    if (!occurredAt.ok) {
      return occurredAt;
    }

    const metadata = freezeSafeMetadata(input.metadata);

    return ok(
      new BillingEvent({
        id: id.data,
        type: type.data,
        occurredAt: occurredAt.data,
        ...(input.organizationId === undefined ? {} : { organizationId: input.organizationId }),
        ...(input.planId === undefined ? {} : { planId: input.planId }),
        ...(input.subscriptionId === undefined ? {} : { subscriptionId: input.subscriptionId }),
        ...(metadata === undefined ? {} : { metadata }),
      }),
    );
  }
}
