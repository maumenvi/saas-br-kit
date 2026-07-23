import assert from 'node:assert/strict';
import test from 'node:test';
import { CreateSubscriptionUseCase } from '../../../../../src/core/entities/subscription/application/subscription.create.ts';
import { setup, subscription } from '../../appointment/application/appointment.support.ts';

test('cria subscription inicializando uso e datas da recorrência', async () => {
  const context = setup();
  context.subscriptionRepository.subscriptions.length = 0;
  const useCase = new CreateSubscriptionUseCase(
    context.executionContext,
    context.subscriptionRepository,
    context.customerRepository,
    context.planRepository,
  );
  const {
    usedServices: _used,
    lastPayment: _last,
    nextPayment: _next,
    paymentProvider: _provider,
    ...input
  } = subscription;

  await useCase.execute(input);

  const saved = context.subscriptionRepository.subscriptions[0]!;
  assert.deepEqual(saved.usedServices, [
    { serviceId: 'service-1', quantity: 2, used: 0 },
  ]);
  assert.equal(saved.paymentProvider, 'local');
  assert.equal(saved.lastPayment.toISOString(), subscription.createdAt.toISOString());
});
