import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Application,
  AppContext,
  CreateOrganizationUseCase,
  CreateUserUseCase,
  pipe,
} from '../src/index.ts';

test('Exporta a superfície pública principal', () => {
  assert.equal(typeof Application, 'function');
  assert.equal(typeof AppContext, 'function');
  assert.equal(typeof CreateOrganizationUseCase, 'function');
  assert.equal(typeof CreateUserUseCase, 'function');
  assert.equal(typeof pipe, 'function');
});
