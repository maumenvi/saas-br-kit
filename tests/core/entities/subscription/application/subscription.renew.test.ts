import assert from 'node:assert/strict';
import test from 'node:test';
import { RenewSubscriptionUseCase } from '../../../../../src/core/entities/subscription/application/subscription.renew.ts';
import { setup, subscription } from '../../appointment/application/appointment.support.ts';

test('renova datas e zera os usos', async () => {
  const context = setup();
  context.subscriptionRepository.subscriptions[0] = {
    ...subscription,
    usedServices: [{ serviceId: 'service-1', quantity: 2, used: 2 }],
  };
  const useCase = new RenewSubscriptionUseCase(
    context.executionContext,
    context.subscriptionRepository,
  );
  const paymentDate = new Date('2026-08-23T00:00:00.000Z');

  await useCase.execute({
    subscriptionId: subscription.id,
    organizationId: subscription.organizationId,
    paymentDate,
  });

  const saved = context.subscriptionRepository.subscriptions[0]!;
  assert.equal(saved.usedServices[0]?.used, 0);
  assert.equal(saved.lastPayment.toISOString(), paymentDate.toISOString());
});
