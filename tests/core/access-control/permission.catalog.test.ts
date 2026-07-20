import test from 'node:test';
import assert from 'node:assert/strict';
import { PERMISSION_KEYS } from '../../../src/core/access-control/permission.catalog.ts';

test('Reúne as permissões em um catálogo único sem duplicidades', () => {
  assert.deepEqual(PERMISSION_KEYS, [
    'organization:create',
    'organization:update',
    'organization:change-status',
    'organization:find',
    'membership:create',
    'membership:update',
    'membership:change-status',
    'membership:find',
    'actor:create',
    'actor:update',
    'actor:change-status',
    'actor:find',
  ]);
  assert.equal(new Set(PERMISSION_KEYS).size, PERMISSION_KEYS.length);
});

test('Usa o padrão recurso:ação em todas as permissões', () => {
  for (const permission of PERMISSION_KEYS) {
    assert.match(permission, /^[a-z]+:[a-z-]+$/);
  }
});
