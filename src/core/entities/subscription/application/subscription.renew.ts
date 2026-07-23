import type { ExecutionContext } from '../../../context/execution.context.ts';
import { SubscriptionErrors } from '../domain/subscription.errors.ts';
import type { SubscriptionRepositoryPort } from '../subscription.repositories.ts';

export type RenewSubscriptionInput = Readonly<{
  subscriptionId: string;
  organizationId: string;
  paymentDate: Date;
  paymentProvider?: string;
}>;

export class RenewSubscriptionUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly subscriptionRepository: SubscriptionRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    subscriptionRepository: SubscriptionRepositoryPort<Status, Extra>,
  ) {
    this.executionContext = executionContext;
    this.subscriptionRepository = subscriptionRepository;
  }

  async execute(input: RenewSubscriptionInput): Promise<void> {
    await this.executionContext.databaseProvider.run(async () => {
      const subscription = await this.subscriptionRepository.findById(input.subscriptionId);
      if (!subscription) throw SubscriptionErrors.notFound(input.subscriptionId);
      if (subscription.organizationId !== input.organizationId) {
        throw SubscriptionErrors.crossOrganizationReference(input.subscriptionId);
      }
      const lastPayment = new Date(input.paymentDate);
      await this.subscriptionRepository.update(Object.freeze({
        ...subscription,
        lastPayment,
        nextPayment: new Date(
          lastPayment.getTime() + subscription.recurrenceDays * 24 * 60 * 60 * 1000,
        ),
        paymentProvider: input.paymentProvider ?? 'local',
        usedServices: subscription.usedServices.map(item => Object.freeze({
          ...item,
          used: 0,
        })),
      }));
    });
  }
}
