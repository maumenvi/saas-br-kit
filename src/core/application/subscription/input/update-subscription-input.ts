import type { SafeMetadata } from "../../../domain/index.ts";
import type { SubscriptionByIdInput } from "./subscription-by-id-input.ts";

export type UpdateSubscriptionInput = SubscriptionByIdInput &
  Readonly<{
    userId?: string;
    metadata?: SafeMetadata | null;
  }>;
