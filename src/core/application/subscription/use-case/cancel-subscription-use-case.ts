import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { Subscription } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { applicationFailureFactory, executionPolicy, useCaseRunner } from "../../shared/index.ts";
import type { SubscriptionAppContext } from "../context/subscription-app-context.ts";
import type { SubscriptionByIdInput } from "../input/subscription-by-id-input.ts";

/** Cancels the external subscription before recording the local canceled state. */
export class CancelSubscriptionUseCase {
  private readonly appContext: SubscriptionAppContext;

  constructor(appContext: SubscriptionAppContext) {
    this.appContext = appContext;
  }

  /** Cancels a provider subscription and persists its local state. */
  async execute(
    executionContext: ExecutionContext,
    input: SubscriptionByIdInput,
  ): Promise<Result<Subscription, CoreError>> {
    const tenant = executionPolicy.ensureTenantScope(executionContext, input.organizationId);
    if (!tenant.ok) {
      return tenant;
    }
    return useCaseRunner.runSafely(async () => {
      const current = await this.appContext.repositories.subscriptions.findById(
        input.subscriptionId,
      );
      if (current === null || current.organizationId !== input.organizationId) {
        return applicationFailureFactory.notFound(
          "subscription.not_found",
          "Subscription was not found.",
        );
      }
      const selected = await this.appContext.paymentProviderSelector.selectProvider({
        organizationId: input.organizationId,
        capability: "subscription",
        requestedProvider: current.provider,
      });
      if (!selected.ok) {
        return selected;
      }
      const canceled = await selected.data.provider.cancelSubscription({
        executionContext,
        connection: selected.data.connection,
        subscription: current,
        requestedAt: this.appContext.clock.now().toISOString(),
      });
      if (!canceled.ok) {
        return canceled;
      }
      const updated = current.applyWebhookStatus({
        status: "canceled",
        updatedAt: this.appContext.clock.now(),
      });
      if (!updated.ok) {
        return updated;
      }
      await this.appContext.repositories.subscriptions.save(updated.data);
      return ok(updated.data);
    });
  }
}
