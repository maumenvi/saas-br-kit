import type { Subscription } from "../../../domain/index.ts";
import type { CoreError } from "../../../errors/result.ts";

export type CreateSubscriptionProviderFailedBillingEventInput = Readonly<{
  id: string;
  occurredAt: string;
  subscription: Subscription;
  provider: string;
  providerErrorCode: string;
  providerErrorKind: CoreError["kind"];
}>;
