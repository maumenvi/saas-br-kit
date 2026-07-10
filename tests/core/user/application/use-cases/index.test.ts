import test from 'node:test';
import assert from 'node:assert/strict';
import { CreateUserUseCase } from '../../../../../src/core/user/application/use-cases/index.ts';

test('Exporta CreateUserUseCase', () => {
  assert.equal(typeof CreateUserUseCase, 'function');
});
