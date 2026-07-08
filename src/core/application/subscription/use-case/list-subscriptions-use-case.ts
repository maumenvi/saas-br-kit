import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { Subscription } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { executionPolicy, useCaseRunner } from "../../shared/index.ts";
import type { SubscriptionAccessAppContext } from "../context/subscription-access-app-context.ts";
import type { RequireSubscriptionAccessInput } from "../input/require-subscription-access-input.ts";

/** Lists subscriptions belonging to one tenant. */
export class ListSubscriptionsUseCase {
  private readonly appContext: SubscriptionAccessAppContext;

  constructor(appContext: SubscriptionAccessAppContext) {
    this.appContext = appContext;
  }

  /** Returns subscriptions after validating tenant scope. */
  async execute(
    executionContext: ExecutionContext,
    input: RequireSubscriptionAccessInput,
  ): Promise<Result<readonly Subscription[], CoreError>> {
    const tenant = executionPolicy.ensureTenantScope(executionContext, input.organizationId);
    if (!tenant.ok) {
      return tenant;
    }
    return useCaseRunner.runSafely(async () =>
      ok(
        await this.appContext.repositories.subscriptions.listByOrganizationId(input.organizationId),
      ),
    );
  }
}
