import type { Plan, SubscriptionStatus } from "#core";
import type { AsaasBillingType, AsaasCycle, AsaasSubscription } from "../client/index.ts";

/** Maps SDK plans and Asaas responses for subscription creation. */
export class AsaasSubscriptionMapper {
  /** Converts SDK billing intervals to Asaas cycles. */
  toCycle(plan: Plan): AsaasCycle {
    return plan.price.interval === "yearly" ? "YEARLY" : "MONTHLY";
  }

  /** Chooses the first v1 billing type supported by the adapter. */
  toBillingType(requested?: AsaasBillingType): AsaasBillingType {
    return requested ?? "PIX";
  }

  /** Converts cents to the decimal value expected by Asaas. */
  toValue(plan: Plan): number {
    return plan.price.amountCents / 100;
  }

  /** Maps Asaas subscription statuses to SDK subscription statuses. */
  toSubscriptionStatus(subscription: AsaasSubscription): SubscriptionStatus {
    switch (subscription.status) {
      case "ACTIVE":
        return "active";
      case "OVERDUE":
        return "past_due";
      case "INACTIVE":
        return "paused";
      case "DELETED":
        return "canceled";
      case "EXPIRED":
        return "expired";
      default:
        return "pending";
    }
  }
}

export const asaasSubscriptionMapper = new AsaasSubscriptionMapper();
