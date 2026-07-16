import test from 'node:test';
import assert from 'node:assert/strict';
import { DomainError } from '../../../../../src/core/shared/domain/domain.error.ts';
import { UserErrors, USER_ERROR_CODE } from '../../../../../src/core/entities/user/domain/user.errors.ts';

test('Cria erro de usuário não encontrado', () => {
  const error = UserErrors.notFound('user-1');

  assert.ok(error instanceof DomainError);
  assert.equal(error.code, USER_ERROR_CODE.USER_NOT_FOUND);
  assert.equal(error.target, 'src/core/user/domain/user.ts');
  assert.match(error.message, /user-1/);
});

test('Cria erro de usuário já existente', () => {
  const error = UserErrors.alreadyExists('marco@example.com');

  assert.equal(error.code, USER_ERROR_CODE.USER_ALREADY_EXISTS);
  assert.match(error.message, /marco@example\.com/);
});

test('Cria erro de e-mail inválido', () => {
  const error = UserErrors.invalidEmail('invalid-email');

  assert.equal(error.code, USER_ERROR_CODE.USER_INVALID_EMAIL);
  assert.match(error.message, /invalid-email/);
});

test('Cria erro de telefone inválido', () => {
  const error = UserErrors.invalidPhone('invalid-phone');

  assert.equal(error.code, USER_ERROR_CODE.USER_INVALID_PHONE);
  assert.match(error.message, /invalid-phone/);
});
