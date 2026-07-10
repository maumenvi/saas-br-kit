import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AppContext,
  CreateUserUseCase,
  DomainError,
  ExecutionContext,
} from '../../src/core/index.ts';

test('Exporta a superfície pública do Core', () => {
  assert.equal(typeof AppContext, 'function');
  assert.equal(typeof ExecutionContext, 'function');
  assert.equal(typeof CreateUserUseCase, 'function');
  assert.equal(typeof DomainError, 'function');
});
