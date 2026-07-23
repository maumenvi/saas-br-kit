import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { ServiceRepositoryPort } from '../service.repositories.ts';
import type { Service } from '../service.ts';

export class FindServiceByIdUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly serviceRepository: ServiceRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    serviceRepository: ServiceRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.serviceRepository = serviceRepository;
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<Service<Status, Extra> | null> {
    return await this.executionContext.databaseProvider.run(async () => {
      const service = await this.serviceRepository.findById(id);
      return service?.organizationId === organizationId ? service : null;
    });
  }

  async findByName(organizationId: string, name: string): Promise<Service<Status, Extra>[]> {
    return await this.executionContext.databaseProvider.run(
      async () => await this.serviceRepository.findByName(organizationId, name),
    );
  }

  async findByOrganizationId(organizationId: string): Promise<Service<Status, Extra>[]> {
    return await this.executionContext.databaseProvider.run(
      async () => await this.serviceRepository.findByOrganizationId(organizationId),
    );
  }

  async findByOneOrMoreIncludedServices(
    organizationId: string,
    serviceIds: string[],
  ): Promise<Service<Status, Extra>[]> {
    return await this.executionContext.databaseProvider.run(
      async () => await this.serviceRepository.findByOneOrMoreIncludedServices(
        organizationId,
        serviceIds,
      ),
    );
  }
}
