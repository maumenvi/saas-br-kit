import test from 'node:test';
import assert from 'node:assert/strict';
import { DomainError } from '../../../../src/core/shared/domain/domain.error.ts';

test('Cria erro de domínio com dados estruturados', () => {
  const error = new DomainError({
    code: 'USER_INVALID',
    target: 'core.user',
    message: 'Invalid user',
    details: { userId: 'user-1' },
  });

  assert.ok(error instanceof Error);
  assert.equal(error.message, 'Invalid user');
  assert.equal(error.code, 'USER_INVALID');
  assert.equal(error.target, 'core.user');
  assert.deepEqual(error.details, { userId: 'user-1' });
});

test('Usa objeto vazio quando details não é informado', () => {
  const error = new DomainError({
    code: 'USER_INVALID',
    target: 'core.user',
    message: 'Invalid user',
  });

  assert.deepEqual(error.details, {});
});
