import type { RepositoriesExtra } from '../core/context/app.context.ts';
import type { ServiceRepositoryPort } from '../core/entities/service/service.repositories.ts';
import type { Service } from '../core/entities/service/service.ts';
import type { Status } from './status.ts';

export class ServiceRepositoryMock implements ServiceRepositoryPort<
  Status,
  RepositoriesExtra['services']
> {
  readonly services: Service<Status>[] = [];

  async save(entity: Service<Status>): Promise<void> { this.services.push(entity); }
  async update(entity: Service<Status>): Promise<void> { this.replace(entity); }
  async changeStatus(entity: Service<Status>): Promise<void> { this.replace(entity); }
  async findById(id: string): Promise<Service<Status> | null> {
    return this.services.find(item => item.id === id) ?? null;
  }
  async findByName(organizationId: string, name: string): Promise<Service<Status>[]> {
    return this.services.filter(item =>
      item.organizationId === organizationId && item.name === name
    );
  }
  async findByOrganizationId(organizationId: string): Promise<Service<Status>[]> {
    return this.services.filter(item => item.organizationId === organizationId);
  }
  async findByOneOrMoreIncludedServices(
    organizationId: string,
    serviceIds: string[],
  ): Promise<Service<Status>[]> {
    return this.services.filter(item =>
      item.organizationId === organizationId &&
      item.includedServiceIds.some(id => serviceIds.includes(id))
    );
  }
  private replace(entity: Service<Status>): void {
    const index = this.services.findIndex(item => item.id === entity.id);
    if (index >= 0) this.services[index] = entity;
  }
}
