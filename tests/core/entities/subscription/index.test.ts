import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ChangeSubscriptionStatusUseCase,
  CreateSubscriptionUseCase,
  FindSubscriptionByIdUseCase,
  UpdateSubscriptionUseCase,
  RenewSubscriptionUseCase,
} from '../../../../src/core/entities/subscription/index.ts';

test('Exporta os casos de uso do módulo Subscription', () => {
  assert.equal(typeof ChangeSubscriptionStatusUseCase, 'function');
  assert.equal(typeof CreateSubscriptionUseCase, 'function');
  assert.equal(typeof FindSubscriptionByIdUseCase, 'function');
  assert.equal(typeof UpdateSubscriptionUseCase, 'function');
  assert.equal(typeof RenewSubscriptionUseCase, 'function');
});
