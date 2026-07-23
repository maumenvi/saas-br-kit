import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthErrors } from '../../../../../src/core/entities/auth/domain/auth.errors.ts';

test('Cria o erro de autenticação não autorizada', () => {
  const error = AuthErrors.unauthorized();

  assert.equal(error.code, 'AUTH_UNAUTHORIZED');
  assert.equal(error.message, 'Actor is not authorized.');
});
