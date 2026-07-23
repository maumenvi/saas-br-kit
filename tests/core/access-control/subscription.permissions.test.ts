import assert from 'node:assert/strict';
import test from 'node:test';
import { SUBSCRIPTION_PERMISSION_KEYS } from '../../../src/core/access-control/subscription.permissions.ts';

test('declara permissões de subscription', () => {
  assert.equal(SUBSCRIPTION_PERMISSION_KEYS.length, 4);
});
