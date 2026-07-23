import assert from 'node:assert/strict';
import test from 'node:test';
import { ACTOR_TYPES } from '../../../../src/core/entities/actor/actor.ts';

test('Define os tipos de actor disponíveis em runtime', () => {
  assert.deepEqual(ACTOR_TYPES, ['USER', 'CLIENT', 'SERVICE']);
});
