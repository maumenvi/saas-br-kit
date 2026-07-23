import type { RepositoriesExtra } from '../core/context/app.context.ts';
import type { PlanRepositoryPort } from '../core/entities/plan/plan.repositories.ts';
import type { Plan } from '../core/entities/plan/plan.ts';
import type { Status } from './status.ts';

export class PlanRepositoryMock implements PlanRepositoryPort<
  Status,
  RepositoriesExtra['plans']
> {
  readonly plans: Plan<Status>[] = [];
  async save(entity: Plan<Status>): Promise<void> { this.plans.push(entity); }
  async update(entity: Plan<Status>): Promise<void> { this.replace(entity); }
  async changeStatus(entity: Plan<Status>): Promise<void> { this.replace(entity); }
  async findById(id: string): Promise<Plan<Status> | null> {
    return this.plans.find(item => item.id === id) ?? null;
  }
  async findByName(organizationId: string, name: string): Promise<Plan<Status>[]> {
    return this.plans.filter(item =>
      item.organizationId === organizationId && item.name === name
    );
  }
  async findByOrganizationId(organizationId: string): Promise<Plan<Status>[]> {
    return this.plans.filter(item => item.organizationId === organizationId);
  }
  async findByOneOrMoreServices(
    organizationId: string,
    serviceIds: string[],
  ): Promise<Plan<Status>[]> {
    return this.plans.filter(item =>
      item.organizationId === organizationId &&
      item.services.some(service => serviceIds.includes(service.serviceId))
    );
  }
  private replace(entity: Plan<Status>): void {
    const index = this.plans.findIndex(item => item.id === entity.id);
    if (index >= 0) this.plans[index] = entity;
  }
}
