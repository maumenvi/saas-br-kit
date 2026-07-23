import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { ChangeSubscriptionStatusUseCase } from '../../../../../src/core/entities/subscription/application/subscription.change.status.ts';
import type { SubscriptionRepositoryPort } from '../../../../../src/core/entities/subscription/subscription.repositories.ts';
import type { Subscription } from '../../../../../src/core/entities/subscription/subscription.ts';

test('ChangeSubscriptionStatusUseCase delega a operação ao repository', async () => {
  const subscription = { id: 'subscription-1', status: 'active' } as Subscription<'active'>;
  let received: Subscription<'active'> | undefined;
  const repository = {
    changeStatus: async (value: Subscription<'active'>) => {
      received = value;
      
    },
  } as unknown as SubscriptionRepositoryPort<'active'>;
  const executionContext = {
    databaseProvider: {
      run: async (callback: (transaction: unknown) => Promise<unknown>) => callback(undefined),
    },
  } as ExecutionContext;
  const useCase = new ChangeSubscriptionStatusUseCase(executionContext, repository);

  await useCase.changeStatus(subscription);

  assert.equal(received, subscription);
  
});
