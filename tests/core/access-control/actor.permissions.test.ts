import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTOR_PERMISSION_KEYS } from '../../../src/core/access-control/actor.permissions.ts';

test('Define as permissões de actor', () => {
  assert.deepEqual(ACTOR_PERMISSION_KEYS, [
    'actor:create',
    'actor:update',
    'actor:change-status',
    'actor:find',
  ]);
});
