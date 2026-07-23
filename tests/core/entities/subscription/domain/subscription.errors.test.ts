import assert from 'node:assert/strict';
import test from 'node:test';
import { SUBSCRIPTION_ERROR_CODE, SubscriptionErrors } from '../../../../../src/core/entities/subscription/domain/subscription.errors.ts';

test('cria erros de subscription', () => {
  assert.equal(
    SubscriptionErrors.invalidRecurrence().code,
    SUBSCRIPTION_ERROR_CODE.INVALID_RECURRENCE,
  );
});
