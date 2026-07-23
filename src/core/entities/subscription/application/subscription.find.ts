import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { SubscriptionRepositoryPort } from '../subscription.repositories.ts';
import type { Subscription } from '../subscription.ts';

export class FindSubscriptionByIdUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly subscriptionRepository: SubscriptionRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    subscriptionRepository: SubscriptionRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.subscriptionRepository = subscriptionRepository;
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<Subscription<Status, Extra> | null> {
    return await this.executionContext.databaseProvider.run(async () => {
      const subscription = await this.subscriptionRepository.findById(id);
      return subscription?.organizationId === organizationId
        ? subscription
        : null;
    });
  }

  async findByCustomerId(
    organizationId: string,
    customerId: string,
  ): Promise<Subscription<Status, Extra>[]> {
    return await this.executionContext.databaseProvider.run(
      async () => await this.subscriptionRepository.findByCustomerId(
        organizationId,
        customerId,
      ),
    );
  }

  async findByPlanId(
    organizationId: string,
    planId: string,
  ): Promise<Subscription<Status, Extra>[]> {
    return await this.executionContext.databaseProvider.run(
      async () => await this.subscriptionRepository.findByPlanId(organizationId, planId),
    );
  }

  async findByOrganizationId(organizationId: string): Promise<Subscription<Status, Extra>[]> {
    return await this.executionContext.databaseProvider.run(
      async () => await this.subscriptionRepository.findByOrganizationId(organizationId),
    );
  }
}
