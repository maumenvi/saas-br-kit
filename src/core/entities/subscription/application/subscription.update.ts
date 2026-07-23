import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { SubscriptionRepositoryPort } from '../subscription.repositories.ts';
import type { Subscription } from '../subscription.ts';
import { SubscriptionErrors } from '../domain/subscription.errors.ts';
import type { CustomerRepositoryPort } from '../../customer/customer.repositories.ts';
import type { PlanRepositoryPort } from '../../plan/plan.repositories.ts';

export class UpdateSubscriptionUseCase<Status, Extra = unknown> {
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

  async update(subscription: Subscription<Status, Extra>): Promise<void> {
    if (!Number.isInteger(subscription.price) || subscription.price < 0) {
      throw SubscriptionErrors.invalidPrice();
    }
    if (!Number.isInteger(subscription.recurrenceDays) || subscription.recurrenceDays <= 0) {
      throw SubscriptionErrors.invalidRecurrence();
    }
    for (const service of subscription.usedServices) {
      if (
        !Number.isInteger(service.quantity) ||
        service.quantity <= 0 ||
        !Number.isInteger(service.used) ||
        service.used < 0 ||
        service.used > service.quantity
      ) {
        throw SubscriptionErrors.invalidUsage(service.serviceId);
      }
    }
    const customer = await this.customerRepository.findById(subscription.customerId);
    if (!customer) throw SubscriptionErrors.customerNotFound(subscription.customerId);
    const plan = await this.planRepository.findById(subscription.planId);
    if (!plan) throw SubscriptionErrors.planNotFound(subscription.planId);
    if (
      customer.organizationId !== subscription.organizationId ||
      plan.organizationId !== subscription.organizationId
    ) {
      throw SubscriptionErrors.crossOrganizationReference(subscription.id);
    }
    for (const service of subscription.usedServices) {
      const planService = plan.services.find(
        item => item.serviceId === service.serviceId,
      );
      if (!planService) {
        throw SubscriptionErrors.serviceNotIncluded(service.serviceId);
      }
      if (service.quantity !== planService.quantity) {
        throw SubscriptionErrors.invalidUsage(service.serviceId);
      }
    }
    for (const planService of plan.services) {
      if (
        !subscription.usedServices.some(
          item => item.serviceId === planService.serviceId,
        )
      ) {
        throw SubscriptionErrors.serviceNotIncluded(planService.serviceId);
      }
    }
    await this.executionContext.databaseProvider.run(async () => {
      await this.subscriptionRepository.update(subscription);
    });
  }
}
