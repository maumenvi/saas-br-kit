import type { RepositoryPort } from '../../ports/repositories.port.ts';
import type { Plan } from './plan.ts';

export interface PlanRepositoryPort<Status, Extra = unknown>
  extends RepositoryPort<Plan<Status, Extra>> {
  findByName(organizationId: string, name: string): Promise<Plan<Status, Extra>[]>;
  findByOrganizationId(organizationId: string): Promise<Plan<Status, Extra>[]>;
  findByOneOrMoreServices(
    organizationId: string,
    serviceIds: string[],
  ): Promise<Plan<Status, Extra>[]>;
}
