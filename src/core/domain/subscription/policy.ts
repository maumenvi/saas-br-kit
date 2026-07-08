import { fail, ok, type Result } from "../../errors/result.ts";
import {
  createDomainRuleError,
  normalizeTimestamp,
  type TimestampInput,
} from "../validation/index.ts";
import type { Subscription } from "./entity.ts";
import type { SubscriptionAccessDecision } from "./types.ts";

/**
 * Evaluates subscription access and lifecycle policies.
 */
export class SubscriptionAccessPolicy {
  /**
   * Evaluates whether a subscription grants access at a given instant.
   */
  decide(
    input: Readonly<{
      subscription: Subscription | null;
      at: TimestampInput;
    }>,
  ): Result<SubscriptionAccessDecision> {
    if (input.subscription === null) {
      return ok(Object.freeze({ allowed: false, reason: "subscription_missing" }));
    }

    const at = normalizeTimestamp("subscription.access.at", input.at);
    if (!at.ok) {
      return at;
    }

    const subscription = input.subscription;
    if (!["active", "trialing"].includes(subscription.status)) {
      return ok(
        Object.freeze({
          allowed: false,
          reason: "subscription_inactive",
          subscriptionId: subscription.id,
          status: subscription.status,
        }),
      );
    }

    const checkedAt = Date.parse(at.data);
    if (
      subscription.currentPeriodStart !== undefined &&
      Date.parse(subscription.currentPeriodStart) > checkedAt
    ) {
      return ok(
        Object.freeze({
          allowed: false,
          reason: "subscription_not_started",
          subscriptionId: subscription.id,
          status: subscription.status,
        }),
      );
    }

    if (
      subscription.currentPeriodEnd !== undefined &&
      Date.parse(subscription.currentPeriodEnd) <= checkedAt
    ) {
      return ok(
        Object.freeze({
          allowed: false,
          reason: "subscription_expired",
          subscriptionId: subscription.id,
          status: subscription.status,
        }),
      );
    }

    return ok(
      Object.freeze({
        allowed: true,
        reason: "subscription_active",
        subscriptionId: subscription.id,
        status: subscription.status,
      }),
    );
  }

  /**
   * Returns an open subscription or a domain error when access cannot proceed.
   */
  requireOpen(subscription: Subscription | null): Result<Subscription> {
    if (subscription === null) {
      return fail(
        createDomainRuleError(
          "subscription.current_missing",
          "Organization does not have a current subscription.",
        ),
      );
    }

    if (!subscription.isOpen()) {
      return fail(
        createDomainRuleError(
          "subscription.current_closed",
          "Organization subscription is closed.",
          {
            subscriptionId: subscription.id,
            status: subscription.status,
          },
        ),
      );
    }

    return ok(subscription);
  }
}

/** Shared subscription access policy used by subscription entities. */
export const subscriptionAccessPolicy = new SubscriptionAccessPolicy();
