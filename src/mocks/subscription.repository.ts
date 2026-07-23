import type { RepositoriesExtra } from '../core/context/app.context.ts';
import type { SubscriptionRepositoryPort } from '../core/entities/subscription/subscription.repositories.ts';
import type { Subscription } from '../core/entities/subscription/subscription.ts';
import type { Status } from './status.ts';

export class SubscriptionRepositoryMock implements SubscriptionRepositoryPort<
  Status,
  RepositoriesExtra['subscriptions']
> {
  readonly subscriptions: Subscription<Status>[] = [];
  async save(entity: Subscription<Status>): Promise<void> { this.subscriptions.push(entity); }
  async update(entity: Subscription<Status>): Promise<void> { this.replace(entity); }
  async changeStatus(entity: Subscription<Status>): Promise<void> { this.replace(entity); }
  async findById(id: string): Promise<Subscription<Status> | null> {
    return this.subscriptions.find(item => item.id === id) ?? null;
  }
  async findByCustomerId(
    organizationId: string,
    customerId: string,
  ): Promise<Subscription<Status>[]> {
    return this.subscriptions.filter(item =>
      item.organizationId === organizationId && item.customerId === customerId
    );
  }
  async findByPlanId(
    organizationId: string,
    planId: string,
  ): Promise<Subscription<Status>[]> {
    return this.subscriptions.filter(item =>
      item.organizationId === organizationId && item.planId === planId
    );
  }
  async findByOrganizationId(organizationId: string): Promise<Subscription<Status>[]> {
    return this.subscriptions.filter(item => item.organizationId === organizationId);
  }
  private replace(entity: Subscription<Status>): void {
    const index = this.subscriptions.findIndex(item => item.id === entity.id);
    if (index >= 0) this.subscriptions[index] = entity;
  }
}
