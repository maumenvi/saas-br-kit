import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { Plan } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { useCaseRunner } from "../../shared/index.ts";
import type { PlanCrudAppContext } from "../context/plan-crud-app-context.ts";
import { ensurePlanAccess } from "../ensure-plan-access.ts";
import type { ListPlansInput } from "../input/list-plans-input.ts";

/** Lists one organization's plans ordered by the repository. */
export class ListPlansUseCase {
  private readonly appContext: PlanCrudAppContext;

  constructor(appContext: PlanCrudAppContext) {
    this.appContext = appContext;
  }

  /** Returns tenant plans after validating read access. */
  async execute(
    executionContext: ExecutionContext,
    input: ListPlansInput,
  ): Promise<Result<readonly Plan[], CoreError>> {
    const access = ensurePlanAccess(executionContext, input.organizationId, "billing:plans:read");
    if (!access.ok) {
      return access;
    }
    return useCaseRunner.runSafely(async () =>
      ok(await this.appContext.repositories.plans.listByOrganizationId(input.organizationId)),
    );
  }
}
