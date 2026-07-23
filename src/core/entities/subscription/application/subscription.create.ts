import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { SubscriptionRepositoryPort } from '../subscription.repositories.ts';
import type { Subscription } from '../subscription.ts';
import type { CreateSubscriptionInput } from './subscription.input.ts';
import type { CustomerRepositoryPort } from '../../customer/customer.repositories.ts';
import type { PlanRepositoryPort } from '../../plan/plan.repositories.ts';
import { SubscriptionErrors } from '../domain/subscription.errors.ts';

export class CreateSubscriptionUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly subscriptionRepository: SubscriptionRepositoryPort<Status, Extra>;
  private readonly customerRepository: CustomerRepositoryPort<unknown, unknown>;
  private readonly planRepository: PlanRepositoryPort<unknown, unknown>;

  constructor(
    executionContext: ExecutionContext,
    subscriptionRepository: SubscriptionRepositoryPort<Status, Extra>,
    customerRepository: CustomerRepositoryPort<unknown, unknown>,
    planRepository: PlanRepositoryPort<unknown, unknown>,
  ) {
    this.executionContext = executionContext;
    this.subscriptionRepository = subscriptionRepository;
    this.customerRepository = customerRepository;
    this.planRepository = planRepository;
  }

  async execute(input: CreateSubscriptionInput<Status, Extra>): Promise<void> {
    if (!Number.isInteger(input.price) || input.price < 0) {
      throw SubscriptionErrors.invalidPrice();
    }
    if (!Number.isInteger(input.recurrenceDays) || input.recurrenceDays <= 0) {
      throw SubscriptionErrors.invalidRecurrence();
    }
    const customer = await this.customerRepository.findById(input.customerId);
    if (!customer) throw SubscriptionErrors.customerNotFound(input.customerId);
    const plan = await this.planRepository.findById(input.planId);
    if (!plan) throw SubscriptionErrors.planNotFound(input.planId);
    if (
      customer.organizationId !== input.organizationId ||
      plan.organizationId !== input.organizationId
    ) {
      throw SubscriptionErrors.crossOrganizationReference(input.id);
    }
    const lastPayment = new Date(input.createdAt);
    const nextPayment = new Date(
      lastPayment.getTime() + input.recurrenceDays * 24 * 60 * 60 * 1000,
    );
    const subscription = Object.freeze({
      ...input,
      paymentProvider: input.paymentProvider ?? 'local',
      lastPayment,
      nextPayment,
      usedServices: plan.services.map(item => Object.freeze({
        serviceId: item.serviceId,
        quantity: item.quantity,
        used: 0,
      })),
    }) as Subscription<Status, Extra>;
    await this.executionContext.databaseProvider.run(async () => {
      await this.subscriptionRepository.save(subscription);
    });
  }
}
