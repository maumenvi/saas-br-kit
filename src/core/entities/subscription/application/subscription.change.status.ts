import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { SubscriptionRepositoryPort } from '../subscription.repositories.ts';
import type { Subscription } from '../subscription.ts';

export class ChangeSubscriptionStatusUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly subscriptionRepository: SubscriptionRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    subscriptionRepository: SubscriptionRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.subscriptionRepository = subscriptionRepository;
  }

  async changeStatus(subscription: Subscription<Status, Extra>): Promise<void> {
    await this.executionContext.databaseProvider.run(async () => {
      await this.subscriptionRepository.changeStatus(subscription);
    });
  }
}
