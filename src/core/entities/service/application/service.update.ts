import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { ServiceRepositoryPort } from '../service.repositories.ts';
import type { Service } from '../service.ts';
import { ServiceErrors } from '../domain/service.errors.ts';

export class UpdateServiceUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly serviceRepository: ServiceRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    serviceRepository: ServiceRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.serviceRepository = serviceRepository;
  }

  async update(service: Service<Status, Extra>): Promise<void> {
    if (!Number.isInteger(service.price) || service.price < 0) {
      throw ServiceErrors.invalidPrice();
    }
    if (!Number.isInteger(service.durationMinutes) || service.durationMinutes <= 0) {
      throw ServiceErrors.invalidDuration();
    }
    for (const includedServiceId of new Set(service.includedServiceIds)) {
      if (includedServiceId === service.id) throw ServiceErrors.selfIncluded(service.id);
      const included = await this.serviceRepository.findById(includedServiceId);
      if (!included) throw ServiceErrors.includedServiceNotFound(includedServiceId);
      if (included.organizationId !== service.organizationId) {
        throw ServiceErrors.crossOrganizationReference(includedServiceId);
      }
    }
    await this.executionContext.databaseProvider.run(async () => {
      await this.serviceRepository.update(service);
    });
  }
}
