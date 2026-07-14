import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ChangeUserStatusUseCase,
  CreateUserUseCase,
  Email,
  FindUserByIdUseCase,
  Telephone,
  UpdateUserUseCase,
} from '../../../src/core/user/index.ts';

test('Exporta o módulo User', () => {
  assert.equal(typeof ChangeUserStatusUseCase, 'function');
  assert.equal(typeof CreateUserUseCase, 'function');
  assert.equal(typeof Email, 'function');
  assert.equal(typeof FindUserByIdUseCase, 'function');
  assert.equal(typeof Telephone, 'function');
  assert.equal(typeof UpdateUserUseCase, 'function');
});
