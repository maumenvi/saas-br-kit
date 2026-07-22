import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AppContext,
  AUDIT_OUTCOMES,
  AuditIntercept,
  AuthUseCase,
  CreateActorUseCase,
  CreateMembershipUseCase,
  CreateOrganizationUseCase,
  DomainError,
  ErrorIntercept,
  ExecutionContext,
  IdempotencyIntercept,
  PERMISSION_KEYS,
} from '../../src/core/index.ts';

test('Exporta a superfície pública do Core', () => {
  assert.equal(typeof AppContext, 'function');
  assert.deepEqual(AUDIT_OUTCOMES, ['SUCCESS', 'ERROR']);
  assert.equal(typeof AuditIntercept, 'function');
  assert.equal(typeof AuthUseCase, 'function');
  assert.equal(typeof CreateActorUseCase, 'function');
  assert.equal(typeof CreateMembershipUseCase, 'function');
  assert.equal(typeof CreateOrganizationUseCase, 'function');
  assert.equal(typeof DomainError, 'function');
  assert.equal(typeof ErrorIntercept, 'function');
  assert.equal(typeof ExecutionContext, 'function');
  assert.equal(typeof IdempotencyIntercept, 'function');
  assert.equal(PERMISSION_KEYS.length, 12);
});
