import { type BillingEvent, BillingEvent as BillingEventEntity } from "../../../domain/index.ts";
import type { Result } from "../../../errors/result.ts";
import type { CreatePlanCreatedBillingEventInput } from "./create-plan-created-billing-event-input.ts";
import type { CreateSubscriptionCreatedBillingEventInput } from "./create-subscription-created-billing-event-input.ts";
import type { CreateSubscriptionProviderFailedBillingEventInput } from "./create-subscription-provider-failed-billing-event-input.ts";

/** Builds billing events emitted by plan and subscription application flows. */
export class BillingEventFactory {
  /** Creates the billing event emitted after a plan is created. */
  planCreated(input: CreatePlanCreatedBillingEventInput): Result<BillingEvent> {
    return BillingEventEntity.create({
      id: input.id,
      type: "plan_created",
      organizationId: input.plan.organizationId,
      planId: input.plan.id,
      occurredAt: input.occurredAt,
      metadata: {
        code: input.plan.code,
        amountCents: input.plan.price.amountCents,
        currency: input.plan.price.currency,
        interval: input.plan.price.interval,
      },
    });
  }

  /** Creates the billing event emitted when provider subscription creation fails. */
  subscriptionProviderFailed(
    input: CreateSubscriptionProviderFailedBillingEventInput,
  ): Result<BillingEvent> {
    return BillingEventEntity.create({
      id: input.id,
      type: "subscription_provider_failed",
      organizationId: input.subscription.organizationId,
      planId: input.subscription.planId,
      subscriptionId: input.subscription.id,
      occurredAt: input.occurredAt,
      metadata: {
        provider: input.provider,
        providerErrorCode: input.providerErrorCode,
        providerErrorKind: input.providerErrorKind,
      },
    });
  }

  /** Creates the billing event emitted after provider-backed subscription creation. */
  subscriptionCreated(input: CreateSubscriptionCreatedBillingEventInput): Result<BillingEvent> {
    return BillingEventEntity.create({
      id: input.id,
      type: "subscription_created",
      organizationId: input.subscription.organizationId,
      planId: input.subscription.planId,
      subscriptionId: input.subscription.id,
      occurredAt: input.occurredAt,
      metadata: {
        provider: input.provider,
        status: input.subscription.status,
      },
    });
  }
}

/** Shared billing event factory used by billing application classes. */
export const billingEventFactory = new BillingEventFactory();

/** Compatibility facade for plan-created billing events. */
export const createPlanCreatedBillingEvent = (
  input: CreatePlanCreatedBillingEventInput,
): Result<BillingEvent> => billingEventFactory.planCreated(input);

/** Compatibility facade for subscription-provider-failed billing events. */
export const createSubscriptionProviderFailedBillingEvent = (
  input: CreateSubscriptionProviderFailedBillingEventInput,
): Result<BillingEvent> => billingEventFactory.subscriptionProviderFailed(input);

/** Compatibility facade for subscription-created billing events. */
export const createSubscriptionCreatedBillingEvent = (
  input: CreateSubscriptionCreatedBillingEventInput,
): Result<BillingEvent> => billingEventFactory.subscriptionCreated(input);
