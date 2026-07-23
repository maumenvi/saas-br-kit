import assert from 'node:assert/strict';
import test from 'node:test';
import { SERVICE_PERMISSION_KEYS } from '../../../src/core/access-control/service.permissions.ts';

test('declara permissões de service', () => {
  assert.deepEqual(SERVICE_PERMISSION_KEYS, [
    'service:create', 'service:update', 'service:change-status', 'service:find',
  ]);
});
