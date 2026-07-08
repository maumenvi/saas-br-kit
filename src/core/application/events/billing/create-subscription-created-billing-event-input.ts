import type { Subscription } from "../../../domain/index.ts";

export type CreateSubscriptionCreatedBillingEventInput = Readonly<{
  id: string;
  occurredAt: string;
  subscription: Subscription;
  provider: string;
}>;
