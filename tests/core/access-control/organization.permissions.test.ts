import test from 'node:test';
import assert from 'node:assert/strict';
import { ORGANIZATION_PERMISSION_KEYS } from '../../../src/core/access-control/organization.permissions.ts';

test('Define as permissões de organização', () => {
  assert.deepEqual(ORGANIZATION_PERMISSION_KEYS, [
    'organization:create',
    'organization:update',
    'organization:change-status',
    'organization:find',
  ]);
});
