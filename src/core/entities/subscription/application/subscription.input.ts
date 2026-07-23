import type { Subscription } from '../subscription.ts';

export type CreateSubscriptionInput<Status, Extra = unknown> = Omit<
  Subscription<Status, Extra>,
  'usedServices' | 'lastPayment' | 'nextPayment' | 'paymentProvider'
> & {
  paymentProvider?: string;
};
