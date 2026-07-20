import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTOR_TYPES,
  ChangeActorStatusUseCase,
  CreateActorUseCase,
  Email,
  FindActorUseCase,
  Telephone,
  UpdateActorUseCase,
} from '../../../../src/core/entities/actor/index.ts';

test('Exporta o módulo Actor', () => {
  assert.deepEqual(ACTOR_TYPES, ['USER', 'CLIENT', 'SERVICE']);
  assert.equal(typeof ChangeActorStatusUseCase, 'function');
  assert.equal(typeof CreateActorUseCase, 'function');
  assert.equal(typeof Email, 'function');
  assert.equal(typeof FindActorUseCase, 'function');
  assert.equal(typeof Telephone, 'function');
  assert.equal(typeof UpdateActorUseCase, 'function');
});
