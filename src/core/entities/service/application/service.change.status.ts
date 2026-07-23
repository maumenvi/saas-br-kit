import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { ServiceRepositoryPort } from '../service.repositories.ts';
import type { Service } from '../service.ts';

export class ChangeServiceStatusUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly serviceRepository: ServiceRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    serviceRepository: ServiceRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.serviceRepository = serviceRepository;
  }

  async changeStatus(service: Service<Status, Extra>): Promise<void> {
    await this.executionContext.databaseProvider.run(async () => {
      await this.serviceRepository.changeStatus(service);
    });
  }
}
