import type { ExecutionContext } from "../../../context/execution-context.ts";
import { Plan } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { applicationFailureFactory, useCaseRunner } from "../../shared/index.ts";
import type { PlanCrudAppContext } from "../context/plan-crud-app-context.ts";
import { ensurePlanAccess } from "../ensure-plan-access.ts";
import type { UpdatePlanInput } from "../input/update-plan-input.ts";

/** Updates mutable plan catalog fields. */
export class UpdatePlanUseCase {
  private readonly appContext: PlanCrudAppContext;

  constructor(appContext: PlanCrudAppContext) {
    this.appContext = appContext;
  }

  /** Persists mutable plan fields after validating tenant write access. */
  async execute(
    executionContext: ExecutionContext,
    input: UpdatePlanInput,
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
        const updated = Plan.create({
          id: current.id,
          organizationId: current.organizationId,
          code: current.code,
          name: input.name ?? current.name,
          amountCents: input.amountCents ?? current.price.amountCents,
          currency: current.price.currency,
          interval: input.interval ?? current.price.interval,
          features: input.features ?? current.features,
          status: current.status,
          createdAt: current.createdAt,
          updatedAt: this.appContext.clock.now(),
          ...(input.metadata === null ? {} : { metadata: input.metadata ?? current.metadata }),
        });
        if (!updated.ok) {
          return updated;
        }
        await this.appContext.repositories.plans.save(updated.data, { transaction });
        return ok(updated.data);
      }),
    );
  }
}
