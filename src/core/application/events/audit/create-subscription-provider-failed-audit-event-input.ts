import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { Subscription } from "../../../domain/index.ts";
import type { CoreError } from "../../../errors/result.ts";

export type CreateSubscriptionProviderFailedAuditEventInput = Readonly<{
  id: string;
  occurredAt: string;
  executionContext: ExecutionContext;
  subscription: Subscription;
  provider: string;
  providerErrorCode: string;
  providerErrorKind: CoreError["kind"];
}>;
