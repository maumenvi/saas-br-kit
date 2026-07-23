import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { ServiceRepositoryPort } from '../service.repositories.ts';
import { ServiceErrors } from '../domain/service.errors.ts';
import type { Service } from '../service.ts';
import type { CreateServiceInput } from './service.input.ts';

export class CreateServiceUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly serviceRepository: ServiceRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    serviceRepository: ServiceRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.serviceRepository = serviceRepository;
  }

  async execute(input: CreateServiceInput<Status, Extra>): Promise<void> {
    const service = Object.freeze({
      ...input,
      includedServiceIds: [...(input.includedServiceIds ?? [])],
    }) as Service<Status, Extra>;
    this.validateNumbers(service);
    await this.validateIncludedServices(service);
    await this.executionContext.databaseProvider.run(async () => {
      await this.serviceRepository.save(service);
    });
  }

  private validateNumbers(service: Service<Status, Extra>): void {
    if (!Number.isInteger(service.price) || service.price < 0) {
      throw ServiceErrors.invalidPrice();
    }
    if (!Number.isInteger(service.durationMinutes) || service.durationMinutes <= 0) {
      throw ServiceErrors.invalidDuration();
    }
  }

  private async validateIncludedServices(service: Service<Status, Extra>): Promise<void> {
    for (const includedServiceId of new Set(service.includedServiceIds)) {
      if (includedServiceId === service.id) throw ServiceErrors.selfIncluded(service.id);
      const included = await this.serviceRepository.findById(includedServiceId);
      if (!included) throw ServiceErrors.includedServiceNotFound(includedServiceId);
      if (included.organizationId !== service.organizationId) {
        throw ServiceErrors.crossOrganizationReference(includedServiceId);
      }
    }
  }
}
