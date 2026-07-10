import test from 'node:test';
import assert from 'node:assert/strict';
import { Aplication, AppContext, CreateUserUseCase } from '../src/index.ts';

test('Exporta a superfície pública principal', () => {
  assert.equal(typeof Aplication, 'function');
  assert.equal(typeof AppContext, 'function');
  assert.equal(typeof CreateUserUseCase, 'function');
});
