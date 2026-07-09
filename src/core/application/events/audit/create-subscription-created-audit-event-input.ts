import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { Subscription } from "../../../domain/index.ts";

export type CreateSubscriptionCreatedAuditEventInput = Readonly<{
  id: string;
  occurredAt: string;
  executionContext: ExecutionContext;
  subscription: Subscription;
  provider: string;
}>;
