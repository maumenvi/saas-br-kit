import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { PlanRepositoryPort } from '../plan.repositories.ts';
import type { PlanInput } from './plan.input.ts';
import type { Plan } from '../plan.ts';
import type { ServiceRepositoryPort } from '../../service/service.repositories.ts';
import { PlanErrors } from '../domain/plan.errors.ts';

export class CreatePlanUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly planRepository: PlanRepositoryPort<Status, Extra>;
  private readonly serviceRepository: ServiceRepositoryPort<unknown, unknown>;

  constructor(
    executionContext: ExecutionContext,
    planRepository: PlanRepositoryPort<Status, Extra>,
    serviceRepository: ServiceRepositoryPort<unknown, unknown>,
  ) {
    this.executionContext = executionContext;
    this.planRepository = planRepository;
    this.serviceRepository = serviceRepository;
  }

  async execute(plan: PlanInput<Status, Extra>): Promise<void> {
    await this.validate(plan);
    await this.executionContext.databaseProvider.run(async () => {
      await this.planRepository.save(plan);
    });
  }

  private async validate(plan: Plan<Status, Extra>): Promise<void> {
    if (!Number.isInteger(plan.price) || plan.price < 0) throw PlanErrors.invalidPrice();
    for (const item of plan.services) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw PlanErrors.invalidQuantity(item.serviceId);
      }
      const service = await this.serviceRepository.findById(item.serviceId);
      if (!service) throw PlanErrors.serviceNotFound(item.serviceId);
      if (service.organizationId !== plan.organizationId) {
        throw PlanErrors.crossOrganizationReference(item.serviceId);
      }
    }
  }
}
