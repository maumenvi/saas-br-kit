import assert from 'node:assert/strict';
import test from 'node:test';
import { createActorPermissionScope } from '../../../../src/composition/application/permission/actor.permission.application.ts';
import { ActorRepositoryMock } from '../../../../src/mocks/actor.repository.ts';
import { AuditRepositoryMock } from '../../../../src/mocks/audit.repository.ts';
import { PolicyActor } from '../../../../src/mocks/status.ts';
import {
  executionContext,
  membershipFixture,
} from './permission.application.support.ts';

test('Monta somente o scope protegido de actor', () => {
  const scope = createActorPermissionScope({
    executionContext: executionContext(),
    actorRepository: new ActorRepositoryMock(),
    auditRepository: new AuditRepositoryMock(),
    actorStatusPolicy: new PolicyActor(),
    permissionContext: membershipFixture(),
  });

  assert.equal(typeof scope.application.create, 'function');
  assert.equal(typeof scope.application.findByEmail, 'function');
  assert.equal(typeof scope.validationQuery.findById, 'function');
  assert.equal('validationQuery' in scope.application, false);
  assert.equal(Object.isFrozen(scope), true);
  assert.equal(Object.isFrozen(scope.application), true);
});
