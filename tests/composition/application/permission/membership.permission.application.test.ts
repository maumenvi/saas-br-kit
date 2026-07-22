import assert from 'node:assert/strict';
import test from 'node:test';
import { createMembershipPermissionScope } from '../../../../src/composition/application/permission/membership.permission.application.ts';
import { AuditRepositoryMock } from '../../../../src/mocks/audit.repository.ts';
import { MembershipRepositoryMock } from '../../../../src/mocks/membership.repository.ts';
import {
  executionContext,
  membershipFixture,
  permissionApplicationInput,
} from './permission.application.support.ts';

test('Monta somente o scope protegido de membership', () => {
  const applicationInput = permissionApplicationInput();
  const scope = createMembershipPermissionScope({
    executionContext: executionContext(),
    membershipRepository: new MembershipRepositoryMock(),
    auditRepository: new AuditRepositoryMock(),
    actorValidationQuery: {
      findById: async (id) => ({
        id,
        type: 'USER',
        enabled: true,
        emailVerified: true,
        telephoneVerified: true,
        email: 'actor@example.com',
      }),
    },
    organizationValidationQuery: {
      findById: async (id) => ({ id, enabled: true }),
    },
    permissionContext: membershipFixture(),
    verificationRepository: applicationInput.repositories.verifications,
    verification: applicationInput.verification,
  });

  assert.equal(typeof scope.application.create, 'function');
  assert.equal(typeof scope.application.findByActorId, 'function');
  assert.equal(typeof scope.application.requestOrganizationInvitation, 'function');
  assert.deepEqual(Object.keys(scope), ['application']);
  assert.equal(Object.isFrozen(scope), true);
  assert.equal(Object.isFrozen(scope.application), true);
});
