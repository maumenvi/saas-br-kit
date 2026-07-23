import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { PlanRepositoryPort } from '../plan.repositories.ts';
import type { Plan } from '../plan.ts';

export class ChangePlanStatusUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly planRepository: PlanRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    planRepository: PlanRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.planRepository = planRepository;
  }

  async changeStatus(plan: Plan<Status, Extra>): Promise<void> {
    await this.executionContext.databaseProvider.run(async () => {
      await this.planRepository.changeStatus(plan);
    });
  }
}
