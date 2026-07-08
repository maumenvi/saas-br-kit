import type { ExecutionContext } from "../../../context/execution-context.ts";
import { Subscription, type SubscriptionAccessDecision } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { executionPolicy, useCaseRunner } from "../../shared/index.ts";
import type { SubscriptionAccessAppContext } from "../context/subscription-access-app-context.ts";
import type { RequireSubscriptionAccessInput } from "../input/require-subscription-access-input.ts";

/** Checks whether a tenant has a subscription that currently grants access. */
export class RequireSubscriptionAccessUseCase {
  private readonly appContext: SubscriptionAccessAppContext;

  /** Stores subscription repository and time source for access decisions. */
  constructor(appContext: SubscriptionAccessAppContext) {
    this.appContext = appContext;
  }

  /** Executes the tenant-scoped subscription access check. */
  async execute(
    executionContext: ExecutionContext,
    input: RequireSubscriptionAccessInput,
  ): Promise<Result<SubscriptionAccessDecision, CoreError>> {
    const tenant = executionPolicy.ensureTenantScope(executionContext, input.organizationId);
    if (!tenant.ok) {
      return tenant;
    }

    return useCaseRunner.runSafely(async () => {
      const subscription =
        await this.appContext.repositories.subscriptions.findCurrentByOrganizationId(
          input.organizationId,
        );
      const decision = Subscription.decideAccess({
        subscription,
        at: this.appContext.clock.now(),
      });

      if (!decision.ok) {
        return decision;
      }

      if (!decision.data.allowed) {
        return {
          ok: false,
          error: {
            kind: "authorization",
            code: "subscription.access_denied",
            message: "Organization subscription does not allow access.",
            details: {
              organizationId: input.organizationId,
              reason: decision.data.reason,
              ...(decision.data.subscriptionId === undefined
                ? {}
                : { subscriptionId: decision.data.subscriptionId }),
              ...(decision.data.status === undefined ? {} : { status: decision.data.status }),
            },
          },
        };
      }

      return ok(decision.data);
    });
  }
}
