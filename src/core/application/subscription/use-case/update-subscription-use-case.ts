import type { ExecutionContext } from "../../../context/execution-context.ts";
import { Subscription } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { applicationFailureFactory, executionPolicy, useCaseRunner } from "../../shared/index.ts";
import type { SubscriptionAccessAppContext } from "../context/subscription-access-app-context.ts";
import type { UpdateSubscriptionInput } from "../input/update-subscription-input.ts";

/** Updates local ownership and metadata without changing provider billing state. */
export class UpdateSubscriptionUseCase {
  private readonly appContext: SubscriptionAccessAppContext;

  constructor(appContext: SubscriptionAccessAppContext) {
    this.appContext = appContext;
  }

  /** Persists local subscription fields after validating tenant scope. */
  async execute(
    executionContext: ExecutionContext,
    input: UpdateSubscriptionInput,
  ): Promise<Result<Subscription, CoreError>> {
    const tenant = executionPolicy.ensureTenantScope(executionContext, input.organizationId);
    if (!tenant.ok) {
      return tenant;
    }
    return useCaseRunner.runSafely(async () =>
      this.appContext.transactionManager.runInTransaction(async (transaction) => {
        const current = await this.appContext.repositories.subscriptions.findById(
          input.subscriptionId,
          { transaction },
        );
        if (current === null || current.organizationId !== input.organizationId) {
          return applicationFailureFactory.notFound(
            "subscription.not_found",
            "Subscription was not found.",
          );
        }
        const userId = input.userId ?? current.userId;
        const updated = Subscription.create({
          id: current.id,
          organizationId: current.organizationId,
          ...(userId === undefined ? {} : { userId }),
          ...(current.customerId === undefined ? {} : { customerId: current.customerId }),
          planId: current.planId,
          status: current.status,
          provider: current.provider,
          providerConnectionId: current.providerConnectionId,
          ...(current.providerCustomerId === undefined
            ? {}
            : { providerCustomerId: current.providerCustomerId }),
          ...(current.providerSubscriptionId === undefined
            ? {}
            : { providerSubscriptionId: current.providerSubscriptionId }),
          ...(current.currentPeriodStart === undefined
            ? {}
            : { currentPeriodStart: current.currentPeriodStart }),
          ...(current.currentPeriodEnd === undefined
            ? {}
            : { currentPeriodEnd: current.currentPeriodEnd }),
          createdAt: current.createdAt,
          updatedAt: this.appContext.clock.now(),
          ...(input.metadata === null ? {} : { metadata: input.metadata ?? current.metadata }),
        });
        if (!updated.ok) {
          return updated;
        }
        await this.appContext.repositories.subscriptions.save(updated.data, { transaction });
        return ok(updated.data);
      }),
    );
  }
}
