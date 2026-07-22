import assert from 'node:assert/strict';
import test from 'node:test';
import { createOrganizationPermissionScope } from '../../../../src/composition/application/permission/organization.permission.application.ts';
import { AuditRepositoryMock } from '../../../../src/mocks/audit.repository.ts';
import { OrganizationRepositoryMock } from '../../../../src/mocks/organization.repository.ts';
import {
  PolicyOrganization,
  PolicyOrganizationSlug,
} from '../../../../src/mocks/status.ts';
import {
  executionContext,
  membershipFixture,
} from './permission.application.support.ts';

test('Monta somente o scope protegido de organization', () => {
  const scope = createOrganizationPermissionScope({
    executionContext: executionContext(),
    organizationRepository: new OrganizationRepositoryMock(),
    auditRepository: new AuditRepositoryMock(),
    actorValidationQuery: {
      findById: async (id) => ({
        id,
        type: 'USER',
        enabled: true,
        emailVerified: true,
        telephoneVerified: true,
      }),
    },
    organizationStatusPolicy: new PolicyOrganization(),
    organizationSlugPolicy: new PolicyOrganizationSlug(),
    permissionContext: membershipFixture(),
  });

  assert.equal(typeof scope.application.create, 'function');
  assert.equal(typeof scope.application.findByCnpj, 'function');
  assert.equal('findBySlug' in scope.application, false);
  assert.equal(typeof scope.validationQuery.findById, 'function');
  assert.equal(Object.isFrozen(scope), true);
  assert.equal(Object.isFrozen(scope.application), true);
});
