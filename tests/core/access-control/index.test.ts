import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTOR_PERMISSION_KEYS,
  MEMBERSHIP_PERMISSION_KEYS,
  ORGANIZATION_PERMISSION_KEYS,
  PERMISSION_KEYS,
} from '../../../src/core/access-control/index.ts';

test('Exporta a superfície pública de controle de acesso', () => {
  assert.equal(PERMISSION_KEYS.length, 12);
  assert.equal(ORGANIZATION_PERMISSION_KEYS.length, 4);
  assert.equal(MEMBERSHIP_PERMISSION_KEYS.length, 4);
  assert.equal(ACTOR_PERMISSION_KEYS.length, 4);
});
