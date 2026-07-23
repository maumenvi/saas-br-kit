import assert from 'node:assert/strict';
import test from 'node:test';
import { SubscriptionRepositoryMock } from '../../src/mocks/subscription.repository.ts';
import { subscription } from '../core/entities/appointment/application/appointment.support.ts';

test('permite mais de uma subscription por customer', async () => {
  const repository = new SubscriptionRepositoryMock();
  await repository.save(subscription);
  await repository.save({ ...subscription, id: 'subscription-2' });
  assert.equal((await repository.findByCustomerId('organization-1', subscription.customerId)).length, 2);
});
