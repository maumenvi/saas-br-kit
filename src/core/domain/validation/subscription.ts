import { fail, ok, type Result } from "../../errors/result.ts";
import { domainErrorFactory } from "./errors.ts";

/**
 * Validates subscription period invariants.
 */
export class SubscriptionPeriodPolicy {
  /**
   * Ensures a current period starts before it ends when both timestamps exist.
   */
  ensureOrder(
    currentPeriodStart: string | undefined,
    currentPeriodEnd: string | undefined,
  ): Result<undefined> {
    if (
      currentPeriodStart !== undefined &&
      currentPeriodEnd !== undefined &&
      Date.parse(currentPeriodStart) >= Date.parse(currentPeriodEnd)
    ) {
      return fail(
        domainErrorFactory.validation(
          "subscription.currentPeriod.invalid",
          "subscription.currentPeriodStart must be before currentPeriodEnd.",
        ),
      );
    }

    return ok(undefined);
  }
}

/** Shared subscription period policy used by the Subscription entity class. */
export const subscriptionPeriodPolicy = new SubscriptionPeriodPolicy();

/** Compatibility facade for subscription period-order validation. */
export const ensureCurrentPeriodOrder = (
  currentPeriodStart: string | undefined,
  currentPeriodEnd: string | undefined,
): Result<undefined> => subscriptionPeriodPolicy.ensureOrder(currentPeriodStart, currentPeriodEnd);
