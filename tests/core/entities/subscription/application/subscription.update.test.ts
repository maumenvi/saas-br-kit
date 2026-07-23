import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { UpdateSubscriptionUseCase } from '../../../../../src/core/entities/subscription/application/subscription.update.ts';
import type { SubscriptionRepositoryPort } from '../../../../../src/core/entities/subscription/subscription.repositories.ts';
import type { Subscription } from '../../../../../src/core/entities/subscription/subscription.ts';
import { CustomerRepositoryMock } from '../../../../../src/mocks/customer.repository.ts';
import { PlanRepositoryMock } from '../../../../../src/mocks/plan.repository.ts';

test('UpdateSubscriptionUseCase delega a operação ao repository', async () => {
  const subscription = {
    id: 'subscription-1',
    status: 'active',
    price: 1000,
    recurrenceDays: 30,
    organizationId: 'organization-1',
    customerId: 'customer-1',
    planId: 'plan-1',
    usedServices: [{ serviceId: 'service-1', quantity: 1, used: 0 }],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastPayment: new Date(),
    nextPayment: new Date(),
    paymentProvider: 'local',
  } as Subscription<'active'>;
  let received: Subscription<'active'> | undefined;
  const repository = {
    update: async (value: Subscription<'active'>) => {
      received = value;
      
    },
  } as unknown as SubscriptionRepositoryPort<'active'>;
  const executionContext = {
    databaseProvider: {
      run: async (callback: (transaction: unknown) => Promise<unknown>) => callback(undefined),
    },
  } as ExecutionContext;
  const customerRepository = new CustomerRepositoryMock();
  customerRepository.customers.push({
    id: 'customer-1',
    organizationId: 'organization-1',
  } as never);
  const planRepository = new PlanRepositoryMock();
  planRepository.plans.push({
    id: 'plan-1',
    organizationId: 'organization-1',
    services: [{ serviceId: 'service-1', quantity: 1 }],
  } as never);
  const useCase = new UpdateSubscriptionUseCase(
    executionContext,
    repository,
    customerRepository,
    planRepository,
  );

  await useCase.update(subscription);

  assert.equal(received, subscription);
  
});
