import type { SafeMetadata } from "../../../domain/index.ts";

export type CreateSubscriptionInput = Readonly<{
  organizationId: string;
  userId: string;
  planId: string;
  customerId: string;
  requestedProvider?: string;
  metadata?: SafeMetadata;
}>;
