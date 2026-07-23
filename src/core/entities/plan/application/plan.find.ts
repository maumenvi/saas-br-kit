import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { PlanRepositoryPort } from '../plan.repositories.ts';
import type { Plan } from '../plan.ts';

export class FindPlanByIdUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly planRepository: PlanRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    planRepository: PlanRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.planRepository = planRepository;
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<Plan<Status, Extra> | null> {
    return await this.executionContext.databaseProvider.run(async () => {
      const plan = await this.planRepository.findById(id);
      return plan?.organizationId === organizationId ? plan : null;
    });
  }

  async findByName(organizationId: string, name: string): Promise<Plan<Status, Extra>[]> {
    return await this.executionContext.databaseProvider.run(
      async () => await this.planRepository.findByName(organizationId, name),
    );
  }

  async findByOrganizationId(organizationId: string): Promise<Plan<Status, Extra>[]> {
    return await this.executionContext.databaseProvider.run(
      async () => await this.planRepository.findByOrganizationId(organizationId),
    );
  }

  async findByOneOrMoreServices(
    organizationId: string,
    serviceIds: string[],
  ): Promise<Plan<Status, Extra>[]> {
    return await this.executionContext.databaseProvider.run(
      async () => await this.planRepository.findByOneOrMoreServices(
        organizationId,
        serviceIds,
      ),
    );
  }
}
