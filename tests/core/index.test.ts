import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AppContext,
  CreateOrganizationUseCase,
  CreateUserUseCase,
  DomainError,
  ErrorIntercept,
  ExecutionContext,
} from '../../src/core/index.ts';

test('Exporta a superfície pública do Core', () => {
  assert.equal(typeof AppContext, 'function');
  assert.equal(typeof CreateOrganizationUseCase, 'function');
  assert.equal(typeof CreateUserUseCase, 'function');
  assert.equal(typeof DomainError, 'function');
  assert.equal(typeof ErrorIntercept, 'function');
  assert.equal(typeof ExecutionContext, 'function');
});
