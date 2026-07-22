import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AppContext,
  ActorNotificationUseCase,
  AUDIT_OUTCOMES,
  AuditIntercept,
  AuthUseCase,
  CreateActorUseCase,
  CreateMembershipUseCase,
  CreateMfaKeyUseCase,
  CreateOrganizationUseCase,
  DomainError,
  ErrorIntercept,
  ExecutionContext,
  IdempotencyIntercept,
  PERMISSION_KEYS,
  ValidateMfaCodeUseCase,
  AcceptVerificationUseCase,
  RequestVerificationUseCase,
} from '../../src/core/index.ts';

test('Exporta a superfície pública do Core', () => {
  assert.equal(typeof AppContext, 'function');
  assert.equal(typeof ActorNotificationUseCase, 'function');
  assert.deepEqual(AUDIT_OUTCOMES, ['SUCCESS', 'ERROR']);
  assert.equal(typeof AuditIntercept, 'function');
  assert.equal(typeof AuthUseCase, 'function');
  assert.equal(typeof CreateActorUseCase, 'function');
  assert.equal(typeof CreateMembershipUseCase, 'function');
  assert.equal(typeof CreateMfaKeyUseCase, 'function');
  assert.equal(typeof CreateOrganizationUseCase, 'function');
  assert.equal(typeof DomainError, 'function');
  assert.equal(typeof ErrorIntercept, 'function');
  assert.equal(typeof ExecutionContext, 'function');
  assert.equal(typeof IdempotencyIntercept, 'function');
  assert.equal(PERMISSION_KEYS.length, 12);
  assert.equal(typeof ValidateMfaCodeUseCase, 'function');
  assert.equal(typeof AcceptVerificationUseCase, 'function');
  assert.equal(typeof RequestVerificationUseCase, 'function');
});
