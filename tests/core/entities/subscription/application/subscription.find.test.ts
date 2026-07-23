import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { FindSubscriptionByIdUseCase } from '../../../../../src/core/entities/subscription/application/subscription.find.ts';
import type { SubscriptionRepositoryPort } from '../../../../../src/core/entities/subscription/subscription.repositories.ts';
import type { Subscription } from '../../../../../src/core/entities/subscription/subscription.ts';

test('FindSubscriptionByIdUseCase delega a operação ao repository', async () => {
  const subscription = {
    id: 'subscription-1',
    status: 'active',
    organizationId: 'organization-1',
  } as Subscription<'active'>;
  let received: string | undefined;
  const repository = {
    findById: async (value: string) => {
      received = value;
      return subscription;
    },
  } as unknown as SubscriptionRepositoryPort<'active'>;
  const executionContext = {
    databaseProvider: {
      run: async (callback: (transaction: unknown) => Promise<unknown>) => callback(undefined),
    },
  } as ExecutionContext;
  const useCase = new FindSubscriptionByIdUseCase(executionContext, repository);

  const result = await useCase.findById('organization-1', subscription.id);

  assert.equal(received, subscription.id);
  assert.equal(result, subscription);
});
