import type { Subscription } from '../subscription.ts';

export interface SubscriptionPaymentStatusPolicyPort<Status, Extra = unknown> {
  isPaymentCurrent(
    subscription: Subscription<Status, Extra>,
    now: Date,
  ): boolean;
}
