import test from 'node:test';
import assert from 'node:assert/strict';
import { MEMBERSHIP_PERMISSION_KEYS } from '../../../src/core/access-control/membership.permissions.ts';

test('Define as permissões de membership', () => {
  assert.deepEqual(MEMBERSHIP_PERMISSION_KEYS, [
    'membership:create',
    'membership:update',
    'membership:change-status',
    'membership:find',
  ]);
});
