import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { Plan } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { applicationFailureFactory, useCaseRunner } from "../../shared/index.ts";
import type { PlanCrudAppContext } from "../context/plan-crud-app-context.ts";
import { ensurePlanAccess } from "../ensure-plan-access.ts";
import type { PlanByIdInput } from "../input/plan-by-id-input.ts";

/** Reads a plan by id. */
export class GetPlanUseCase {
  private readonly appContext: PlanCrudAppContext;

  constructor(appContext: PlanCrudAppContext) {
    this.appContext = appContext;
  }

  /** Returns a tenant plan after validating read access. */
  async execute(
    executionContext: ExecutionContext,
    input: PlanByIdInput,
  ): Promise<Result<Plan, CoreError>> {
    const access = ensurePlanAccess(executionContext, input.organizationId, "billing:plans:read");
    if (!access.ok) {
      return access;
    }
    return useCaseRunner.runSafely(async () => {
      const plan = await this.appContext.repositories.plans.findById(
        input.organizationId,
        input.planId,
      );
      return plan === null
        ? applicationFailureFactory.notFound("plan.not_found", "Plan was not found.")
        : ok(plan);
    });
  }
}
