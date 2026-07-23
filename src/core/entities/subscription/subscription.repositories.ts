import type { RepositoryPort } from '../../ports/repositories.port.ts';
import type { Subscription } from './subscription.ts';

export interface SubscriptionRepositoryPort<Status, Extra = unknown>
  extends RepositoryPort<Subscription<Status, Extra>> {
  findByCustomerId(
    organizationId: string,
    customerId: string,
  ): Promise<Subscription<Status, Extra>[]>;
  findByPlanId(organizationId: string, planId: string): Promise<Subscription<Status, Extra>[]>;
  findByOrganizationId(organizationId: string): Promise<Subscription<Status, Extra>[]>;
}
