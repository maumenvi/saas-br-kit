import { ok, type Result } from "../../errors/result.ts";
import { freezeSafeMetadata } from "../metadata/index.ts";
import {
  ensureAllowedString,
  ensureCurrentPeriodOrder,
  normalizeOptionalText,
  normalizeOptionalTimestamp,
  normalizeRequiredText,
  normalizeTimestamp,
} from "../validation/index.ts";
import { Subscription } from "./entity.ts";
import { SUBSCRIPTION_STATUSES } from "./status.ts";
import type { CreateSubscriptionEntityInput } from "./types.ts";

/**
 * Builds immutable subscriptions from normalized and validated input.
 */
export class SubscriptionBuilder {
  /**
   * Validates subscription identity, provider data, period and timestamps.
   */
  build(input: CreateSubscriptionEntityInput): Result<Subscription> {
    const id = normalizeRequiredText("subscription.id", input.id, { maxLength: 120 });
    if (!id.ok) {
      return id;
    }

    const organizationId = normalizeRequiredText(
      "subscription.organizationId",
      input.organizationId,
      { maxLength: 120 },
    );
    if (!organizationId.ok) {
      return organizationId;
    }

    const customerId = normalizeOptionalText("subscription.customerId", input.customerId, {
      maxLength: 120,
    });
    if (!customerId.ok) {
      return customerId;
    }

    const userId = normalizeOptionalText("subscription.userId", input.userId, { maxLength: 120 });
    if (!userId.ok) {
      return userId;
    }

    const planId = normalizeRequiredText("subscription.planId", input.planId, { maxLength: 120 });
    if (!planId.ok) {
      return planId;
    }

    const provider = normalizeRequiredText("subscription.provider", input.provider, {
      maxLength: 80,
    });
    if (!provider.ok) {
      return provider;
    }

    const providerConnectionId = normalizeRequiredText(
      "subscription.providerConnectionId",
      input.providerConnectionId,
      { maxLength: 120 },
    );
    if (!providerConnectionId.ok) {
      return providerConnectionId;
    }

    const status = ensureAllowedString(
      "subscription.status",
      input.status ?? "pending",
      SUBSCRIPTION_STATUSES,
    );
    if (!status.ok) {
      return status;
    }

    const currentPeriodStart = normalizeOptionalTimestamp(
      "subscription.currentPeriodStart",
      input.currentPeriodStart,
    );
    if (!currentPeriodStart.ok) {
      return currentPeriodStart;
    }

    const currentPeriodEnd = normalizeOptionalTimestamp(
      "subscription.currentPeriodEnd",
      input.currentPeriodEnd,
    );
    if (!currentPeriodEnd.ok) {
      return currentPeriodEnd;
    }

    const periodOrder = ensureCurrentPeriodOrder(currentPeriodStart.data, currentPeriodEnd.data);
    if (!periodOrder.ok) {
      return periodOrder;
    }

    const createdAt = normalizeTimestamp("subscription.createdAt", input.createdAt);
    if (!createdAt.ok) {
      return createdAt;
    }

    const updatedAt = normalizeTimestamp(
      "subscription.updatedAt",
      input.updatedAt ?? createdAt.data,
    );
    if (!updatedAt.ok) {
      return updatedAt;
    }

    const providerCustomerId = normalizeOptionalText(
      "subscription.providerCustomerId",
      input.providerCustomerId,
      { maxLength: 120 },
    );
    if (!providerCustomerId.ok) {
      return providerCustomerId;
    }

    const providerSubscriptionId = normalizeOptionalText(
      "subscription.providerSubscriptionId",
      input.providerSubscriptionId,
      { maxLength: 120 },
    );
    if (!providerSubscriptionId.ok) {
      return providerSubscriptionId;
    }

    const metadata = freezeSafeMetadata(input.metadata);

    return ok(
      new Subscription({
        id: id.data,
        organizationId: organizationId.data,
        ...(userId.data === undefined ? {} : { userId: userId.data }),
        ...(customerId.data === undefined ? {} : { customerId: customerId.data }),
        planId: planId.data,
        status: status.data,
        provider: provider.data,
        providerConnectionId: providerConnectionId.data,
        ...(providerCustomerId.data === undefined
          ? {}
          : { providerCustomerId: providerCustomerId.data }),
        ...(providerSubscriptionId.data === undefined
          ? {}
          : { providerSubscriptionId: providerSubscriptionId.data }),
        ...(currentPeriodStart.data === undefined
          ? {}
          : { currentPeriodStart: currentPeriodStart.data }),
        ...(currentPeriodEnd.data === undefined ? {} : { currentPeriodEnd: currentPeriodEnd.data }),
        createdAt: createdAt.data,
        updatedAt: updatedAt.data,
        ...(metadata === undefined ? {} : { metadata }),
      }),
    );
  }
}

/** Shared subscription builder used by subscription entities and transitions. */
export const subscriptionBuilder = new SubscriptionBuilder();
