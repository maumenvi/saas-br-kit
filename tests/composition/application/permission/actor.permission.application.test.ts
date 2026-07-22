import assert from 'node:assert/strict';
import test from 'node:test';
import { createActorPermissionScope } from '../../../../src/composition/application/permission/actor.permission.application.ts';
import { ActorRepositoryMock } from '../../../../src/mocks/actor.repository.ts';
import { AuditRepositoryMock } from '../../../../src/mocks/audit.repository.ts';
import { PolicyActor } from '../../../../src/mocks/status.ts';
import {
  executionContext,
  membershipFixture,
  permissionApplicationInput,
} from './permission.application.support.ts';

test('Monta somente o scope protegido de actor', () => {
  const applicationInput = permissionApplicationInput();
  const scope = createActorPermissionScope({
    executionContext: executionContext(),
    actorRepository: new ActorRepositoryMock(),
    auditRepository: new AuditRepositoryMock(),
    actorStatusPolicy: new PolicyActor(),
    permissionContext: membershipFixture(),
    verificationRepository: applicationInput.repositories.verifications,
    verification: applicationInput.verification,
  });

  assert.equal(typeof scope.application.create, 'function');
  assert.equal(typeof scope.application.findByEmail, 'function');
  assert.equal(
    typeof scope.application.sendOrganizationWelcomeEmail,
    'function',
  );
  assert.equal(
    typeof scope.application.sendOrganizationInvitationEmail,
    'function',
  );
  assert.equal(typeof scope.application.requestEmailConfirmation, 'function');
  assert.equal(
    typeof scope.application.requestTelephoneConfirmation,
    'function',
  );
  assert.equal(typeof scope.application.sendEmailConfirmation, 'function');
  assert.equal(typeof scope.application.sendTelephoneConfirmation, 'function');
  assert.equal(typeof scope.validationQuery.findById, 'function');
  assert.equal('validationQuery' in scope.application, false);
  assert.equal(Object.isFrozen(scope), true);
  assert.equal(Object.isFrozen(scope.application), true);
});
