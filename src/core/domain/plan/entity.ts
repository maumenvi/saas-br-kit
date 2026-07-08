import { fail, ok, type Result } from "../../errors/result.ts";
import type { OrganizationId, PlanId } from "../index.ts";
import type { SafeMetadata } from "../metadata/index.ts";
import { freezeSafeMetadata } from "../metadata/index.ts";
import {
  createDomainValidationError,
  ensureAllowedString,
  normalizePlanCode,
  normalizePlanFeatures,
  normalizeRequiredText,
  normalizeTimestamp,
} from "../validation/index.ts";
import type { PlanStatus } from "./constants.ts";
import { PLAN_BILLING_INTERVALS, PLAN_STATUSES } from "./constants.ts";
import type { CreatePlanEntityInput, PlanPrice, PlanProps } from "./types.ts";

/**
 * Represents a sellable billing plan with BRL recurring price.
 */
export class Plan {
  /** Plan identifier used by subscriptions and repositories. */
  public readonly id: PlanId;

  /** Organization that owns this plan catalog entry. */
  public readonly organizationId: OrganizationId;

  /** Normalized organization-scoped code used by APIs and persistence. */
  public readonly code: string;

  /** Human-readable plan name. */
  public readonly name: string;

  /** Recurring price for this plan. */
  public readonly price: PlanPrice;

  /** Optional normalized feature labels shown to consumers. */
  public readonly features: readonly string[];

  /** Lifecycle status used to sell or hide the plan. */
  public readonly status: PlanStatus;

  /** ISO timestamp for entity creation. */
  public readonly createdAt: string;

  /** ISO timestamp for the last entity update. */
  public readonly updatedAt: string;

  /** Optional safe metadata for plan-specific extension data. */
  public readonly metadata?: SafeMetadata;

  /** Stores normalized plan properties immutably. */
  private constructor(props: PlanProps) {
    this.id = props.id;
    this.organizationId = props.organizationId;
    this.code = props.code;
    this.name = props.name;
    this.price = props.price;
    this.features = props.features;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    if (props.metadata !== undefined) {
      this.metadata = props.metadata;
    }
    Object.freeze(this);
  }

  /**
   * Creates a plan after validating code, price, interval and timestamps.
   */
  static create(input: CreatePlanEntityInput): Result<Plan> {
    const id = normalizeRequiredText("plan.id", input.id, { maxLength: 120 });
    if (!id.ok) {
      return id;
    }

    const organizationId = normalizeRequiredText("plan.organizationId", input.organizationId, {
      maxLength: 120,
    });
    if (!organizationId.ok) {
      return organizationId;
    }

    const code = normalizePlanCode(input.code);
    if (!code.ok) {
      return code;
    }

    const name = normalizeRequiredText("plan.name", input.name, {
      minLength: 2,
      maxLength: 120,
    });
    if (!name.ok) {
      return name;
    }

    if (!Number.isSafeInteger(input.amountCents) || input.amountCents <= 0) {
      return fail(
        createDomainValidationError(
          "plan.price.amountCents.invalid",
          "plan.price.amountCents must be a positive safe integer.",
        ),
      );
    }

    const interval = ensureAllowedString(
      "plan.price.interval",
      input.interval,
      PLAN_BILLING_INTERVALS,
    );
    if (!interval.ok) {
      return interval;
    }

    const status = ensureAllowedString("plan.status", input.status ?? "active", PLAN_STATUSES);
    if (!status.ok) {
      return status;
    }

    const features = normalizePlanFeatures(input.features);
    if (!features.ok) {
      return features;
    }

    const createdAt = normalizeTimestamp("plan.createdAt", input.createdAt);
    if (!createdAt.ok) {
      return createdAt;
    }

    const updatedAt = normalizeTimestamp("plan.updatedAt", input.updatedAt ?? createdAt.data);
    if (!updatedAt.ok) {
      return updatedAt;
    }

    const metadata = freezeSafeMetadata(input.metadata);

    return ok(
      new Plan({
        id: id.data,
        organizationId: organizationId.data,
        code: code.data,
        name: name.data,
        price: Object.freeze({
          amountCents: input.amountCents,
          currency: input.currency ?? "BRL",
          interval: interval.data,
        }),
        features: features.data,
        status: status.data,
        createdAt: createdAt.data,
        updatedAt: updatedAt.data,
        ...(metadata === undefined ? {} : { metadata }),
      }),
    );
  }
}
