import test from 'node:test';
import assert from 'node:assert/strict';
import { CreateUserUseCase, Email, Telephone } from '../../../src/core/user/index.ts';

test('Exporta o módulo User', () => {
  assert.equal(typeof CreateUserUseCase, 'function');
  assert.equal(typeof Email, 'function');
  assert.equal(typeof Telephone, 'function');
});
