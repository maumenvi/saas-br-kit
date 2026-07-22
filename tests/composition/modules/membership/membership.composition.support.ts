import type { MembershipCompositionInput } from '../../../../src/composition/modules/membership/membership.composition.input.ts';
import type { PermissionContext } from '../../../../src/core/access-control/permission.intercept.ts';
import { ExecutionContext } from '../../../../src/core/context/execution.context.ts';
import type { Membership } from '../../../../src/core/entities/membership/membership.ts';
import { AuditRepositoryMock } from '../../../../src/mocks/audit.repository.ts';
import { DatabaseMock } from '../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../src/mocks/logger.ts';
import { MembershipRepositoryMock } from '../../../../src/mocks/membership.repository.ts';
import { PasswordHashMock } from '../../../../src/mocks/password.hash.ts';
import type { Status } from '../../../../src/mocks/status.ts';

export const membershipPermissionContext: PermissionContext = {
  id: 'membership-admin',
  actorId: 'actor-admin',
  organizationId: 'organization-1',
  permissions: [
    'membership:create',
    'membership:update',
    'membership:change-status',
    'membership:find',
  ].map((permission) => ({
    membershipId: 'membership-admin',
    permission: permission as PermissionContext['permissions'][number]['permission'],
    effect: 'allow',
  })),
};

export function membershipFixture(): Membership<Status> {
  return {
    id: 'membership-1',
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    updatedAt: new Date('2026-07-16T00:00:00.000Z'),
    status: 'active',
    organizationId: 'organization-1',
    actorId: 'actor-1',
    role: 'owner',
    permissions: [],
  };
}

export function membershipCompositionInput(
  repository = new MembershipRepositoryMock(),
): MembershipCompositionInput<Status> {
  return {
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    membershipRepository: repository,
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
    permissionContext: membershipPermissionContext,
  };
}
