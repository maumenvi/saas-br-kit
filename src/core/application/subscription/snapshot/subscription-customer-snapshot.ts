import { freezeSafeMetadata } from "../../../domain/index.ts";
import type { SubscriptionCustomerInput } from "../../../ports/index.ts";

/** Creates immutable payment-provider customer snapshots for subscription flows. */
export class SubscriptionCustomerSnapshot {
  /** Freezes customer input and nested metadata before passing it to provider ports. */
  freeze(input: SubscriptionCustomerInput): SubscriptionCustomerInput {
    const metadata = freezeSafeMetadata(input.metadata);

    return Object.freeze({
      name: input.name,
      ...(input.email === undefined ? {} : { email: input.email }),
      ...(input.document === undefined ? {} : { document: input.document }),
      ...(metadata === undefined ? {} : { metadata }),
    });
  }
}

/** Shared customer snapshot factory used by subscription use cases. */
export const subscriptionCustomerSnapshot = new SubscriptionCustomerSnapshot();
