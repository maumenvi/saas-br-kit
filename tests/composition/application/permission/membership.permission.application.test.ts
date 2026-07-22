import assert from 'node:assert/strict';
import test from 'node:test';
import { createMembershipPermissionScope } from '../../../../src/composition/application/permission/membership.permission.application.ts';
import { AuditRepositoryMock } from '../../../../src/mocks/audit.repository.ts';
import { MembershipRepositoryMock } from '../../../../src/mocks/membership.repository.ts';
import {
  executionContext,
  membershipFixture,
} from './permission.application.support.ts';

test('Monta somente o scope protegido de membership', () => {
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
      }),
    },
    organizationValidationQuery: {
      findById: async (id) => ({ id, enabled: true }),
    },
    permissionContext: membershipFixture(),
  });

  assert.equal(typeof scope.application.create, 'function');
  assert.equal(typeof scope.application.findByActorId, 'function');
  assert.deepEqual(Object.keys(scope), ['application']);
  assert.equal(Object.isFrozen(scope), true);
  assert.equal(Object.isFrozen(scope.application), true);
});
