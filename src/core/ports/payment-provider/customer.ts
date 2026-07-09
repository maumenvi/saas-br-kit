import type { SafeMetadata } from "../../domain/index.ts";

export type SubscriptionCustomerInput = Readonly<{
  name: string;
  email?: string;
  document?: string;
  metadata?: SafeMetadata;
}>;
