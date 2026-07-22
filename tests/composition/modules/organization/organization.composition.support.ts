import type { OrganizationCompositionInput } from '../../../../src/composition/modules/organization/organization.composition.input.ts';
import type { PermissionContext } from '../../../../src/core/access-control/permission.intercept.ts';
import { ExecutionContext } from '../../../../src/core/context/execution.context.ts';
import { CNPJ } from '../../../../src/core/entities/organization/domain/cnpj.ts';
import { OrganizationSlug } from '../../../../src/core/entities/organization/domain/organization.slug.ts';
import type { Organization } from '../../../../src/core/entities/organization/organization.ts';
import { AuditRepositoryMock } from '../../../../src/mocks/audit.repository.ts';
import { DatabaseMock } from '../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../src/mocks/logger.ts';
import { OrganizationRepositoryMock } from '../../../../src/mocks/organization.repository.ts';
import { PasswordHashMock } from '../../../../src/mocks/password.hash.ts';
import type { Status } from '../../../../src/mocks/status.ts';

export const organizationPermissionContext: PermissionContext = {
  id: 'membership-1',
  actorId: 'actor-1',
  organizationId: 'organization-1',
  permissions: [
    'organization:create',
    'organization:update',
    'organization:change-status',
    'organization:find',
  ].map((permission) => ({
    membershipId: 'membership-1',
    permission: permission as PermissionContext['permissions'][number]['permission'],
    effect: 'allow',
  })),
};

export function organizationFixture(): Organization<Status> {
  return {
    id: 'organization-1',
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    updatedAt: new Date('2026-07-16T00:00:00.000Z'),
    status: 'active',
    name: 'Maumenvi',
    slug: new OrganizationSlug('maumenvi'),
    cnpj: new CNPJ('90.021.382/0001-22'),
    ownerActorId: 'actor-1',
  };
}

export function organizationCompositionInput(
  repository = new OrganizationRepositoryMock(),
): OrganizationCompositionInput<Status> {
  return {
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    organizationRepository: repository,
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
    policy: {
      organizationStatusPolicy: {
        isEnabled: (status) => status === 'active',
      },
      organizationSlugPolicy: {
        isReserved: (slug) => ['admin', 'api', 'auth', 'www'].includes(slug),
      },
    },
    permissionContext: organizationPermissionContext,
  };
}
