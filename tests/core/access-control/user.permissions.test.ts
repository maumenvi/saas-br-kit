import test from 'node:test';
import assert from 'node:assert/strict';
import { USER_PERMISSION_KEYS } from '../../../src/core/access-control/user.permissions.ts';

test('Define as permissões de usuário', () => {
  assert.deepEqual(USER_PERMISSION_KEYS, [
    'user:create',
    'user:update',
    'user:change-status',
    'user:find',
  ]);
});
