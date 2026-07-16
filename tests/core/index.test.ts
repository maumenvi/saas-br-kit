import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AppContext,
  CreateMembershipUseCase,
  CreateOrganizationUseCase,
  CreateUserUseCase,
  DomainError,
  ErrorIntercept,
  ExecutionContext,
  PERMISSION_KEYS,
} from '../../src/core/index.ts';

test('Exporta a superfície pública do Core', () => {
  assert.equal(typeof AppContext, 'function');
  assert.equal(typeof CreateMembershipUseCase, 'function');
  assert.equal(typeof CreateOrganizationUseCase, 'function');
  assert.equal(typeof CreateUserUseCase, 'function');
  assert.equal(typeof DomainError, 'function');
  assert.equal(typeof ErrorIntercept, 'function');
  assert.equal(typeof ExecutionContext, 'function');
  assert.equal(PERMISSION_KEYS.length, 12);
});
