import type { ExecutionContext } from "../../../context/execution-context.ts";
import { Plan } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { applicationFailureFactory, useCaseRunner } from "../../shared/index.ts";
import type { PlanCrudAppContext } from "../context/plan-crud-app-context.ts";
import { ensurePlanAccess } from "../ensure-plan-access.ts";
import type { PlanByIdInput } from "../input/plan-by-id-input.ts";

/** Soft-deletes a plan so existing subscriptions keep a valid foreign key. */
export class DisablePlanUseCase {
  private readonly appContext: PlanCrudAppContext;

  constructor(appContext: PlanCrudAppContext) {
    this.appContext = appContext;
  }

  /** Moves one plan to the inactive lifecycle state. */
  async execute(
    executionContext: ExecutionContext,
    input: PlanByIdInput,
  ): Promise<Result<Plan, CoreError>> {
    const access = ensurePlanAccess(executionContext, input.organizationId, "billing:plans:write");
    if (!access.ok) {
      return access;
    }
    return useCaseRunner.runSafely(async () =>
      this.appContext.transactionManager.runInTransaction(async (transaction) => {
        const current = await this.appContext.repositories.plans.findById(
          input.organizationId,
          input.planId,
          { transaction },
        );
        if (current === null) {
          return applicationFailureFactory.notFound("plan.not_found", "Plan was not found.");
        }
        const deleted = Plan.create({
          id: current.id,
          organizationId: current.organizationId,
          code: current.code,
          name: current.name,
          amountCents: current.price.amountCents,
          currency: current.price.currency,
          interval: current.price.interval,
          features: current.features,
          status: "inactive",
          createdAt: current.createdAt,
          updatedAt: this.appContext.clock.now(),
          ...(current.metadata === undefined ? {} : { metadata: current.metadata }),
        });
        if (!deleted.ok) {
          return deleted;
        }
        await this.appContext.repositories.plans.save(deleted.data, { transaction });
        return ok(deleted.data);
      }),
    );
  }
}
