import type { RepositoryPort } from '../../ports/repositories.port.ts';
import type { Service } from './service.ts';

export interface ServiceRepositoryPort<Status, Extra = unknown>
  extends RepositoryPort<Service<Status, Extra>> {
  findByName(organizationId: string, name: string): Promise<Service<Status, Extra>[]>;
  findByOrganizationId(organizationId: string): Promise<Service<Status, Extra>[]>;
  findByOneOrMoreIncludedServices(
    organizationId: string,
    serviceIds: string[],
  ): Promise<Service<Status, Extra>[]>;
}
