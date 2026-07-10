import test from 'node:test';
import assert from 'node:assert/strict';
import { CreateUserUseCase } from '../../../../src/core/user/application/index.ts';

test('Exporta os componentes de Application do módulo User', () => {
  assert.equal(typeof CreateUserUseCase, 'function');
});
