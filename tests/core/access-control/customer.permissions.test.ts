import assert from 'node:assert/strict';
import test from 'node:test';
import { CUSTOMER_PERMISSION_KEYS } from '../../../src/core/access-control/customer.permissions.ts';

test('declara permissões de customer', () => {
  assert.equal(CUSTOMER_PERMISSION_KEYS.length, 4);
});
