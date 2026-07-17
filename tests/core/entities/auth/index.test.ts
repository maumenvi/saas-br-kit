import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AuthUseCase,
} from '../../../../src/core/entities/auth/index.ts';

test('Exporta o caso de uso do módulo Auth', () => {
  assert.equal(typeof AuthUseCase, 'function');
});
