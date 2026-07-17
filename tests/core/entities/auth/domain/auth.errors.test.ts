import assert from 'node:assert/strict';
import test from 'node:test';
import { MembershipErrors } from '../../../../../src/core/entities/auth/domain/auth.errors.ts';

test('Cria o erro de autenticação não autorizada', () => {
  const error = MembershipErrors.notFound();

  assert.equal(error.code, 'AUTH_UNAUTHORIZED');
  assert.equal(error.message, 'User is not authorized.');
});
