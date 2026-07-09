import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { Subscription } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { applicationFailureFactory, executionPolicy, useCaseRunner } from "../../shared/index.ts";
import type { SubscriptionAccessAppContext } from "../context/subscription-access-app-context.ts";
import type { SubscriptionByIdInput } from "../input/subscription-by-id-input.ts";

/** Reads one tenant-scoped subscription. */
export class GetSubscriptionUseCase {
  private readonly appContext: SubscriptionAccessAppContext;

  constructor(appContext: SubscriptionAccessAppContext) {
    this.appContext = appContext;
  }

  /** Returns one subscription after validating tenant scope. */
  async execute(
    executionContext: ExecutionContext,
    input: SubscriptionByIdInput,
  ): Promise<Result<Subscription, CoreError>> {
    const tenant = executionPolicy.ensureTenantScope(executionContext, input.organizationId);
    if (!tenant.ok) {
      return tenant;
    }
    return useCaseRunner.runSafely(async () => {
      const subscription = await this.appContext.repositories.subscriptions.findById(
        input.subscriptionId,
      );
      return subscription === null || subscription.organizationId !== input.organizationId
        ? applicationFailureFactory.notFound(
            "subscription.not_found",
            "Subscription was not found.",
          )
        : ok(subscription);
    });
  }
}
