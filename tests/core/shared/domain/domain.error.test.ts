import test from 'node:test';
import assert from 'node:assert/strict';
import { DomainError } from '../../../../src/core/shared/domain/domain.error.ts';

test('Cria erro de domínio com dados estruturados', () => {
  const error = new DomainError({
    code: 'ACTOR_INVALID',
    target: 'core.actor',
    message: 'Invalid user',
    details: { actorId: 'actor-1' },
  });

  assert.ok(error instanceof Error);
  assert.equal(error.message, 'Invalid user');
  assert.equal(error.code, 'ACTOR_INVALID');
  assert.equal(error.target, 'core.actor');
  assert.deepEqual(error.details, { actorId: 'actor-1' });
});

test('Usa objeto vazio quando details não é informado', () => {
  const error = new DomainError({
    code: 'ACTOR_INVALID',
    target: 'core.actor',
    message: 'Invalid user',
  });

  assert.deepEqual(error.details, {});
});
