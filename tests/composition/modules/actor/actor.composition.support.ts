import type { PermissionContext } from '../../../../src/core/access-control/permission.intercept.ts';
import { ExecutionContext } from '../../../../src/core/context/execution.context.ts';
import type { ActorCompositionInput } from '../../../../src/composition/modules/actor/actor.composition.input.ts';
import { Email } from '../../../../src/core/entities/actor/domain/email.ts';
import { Telephone } from '../../../../src/core/entities/actor/domain/telephone.ts';
import type { Actor } from '../../../../src/core/entities/actor/actor.ts';
import { ActorRepositoryMock } from '../../../../src/mocks/actor.repository.ts';
import { AuditRepositoryMock } from '../../../../src/mocks/audit.repository.ts';
import { DatabaseMock } from '../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../src/mocks/logger.ts';
import { PasswordHashMock } from '../../../../src/mocks/password.hash.ts';
import type { Status } from '../../../../src/mocks/status.ts';
import { verificationConfigMock } from '../../../../src/mocks/verification.credential.ts';
import { VerificationRepositoryMock } from '../../../../src/mocks/verification.repository.ts';

export const actorPermissionContext: PermissionContext = {
  id: 'membership-1',
  actorId: 'actor-admin',
  organizationId: 'organization-1',
  permissions: [
    'actor:create',
    'actor:update',
    'actor:change-status',
    'actor:find',
    'organization:create',
    'membership:create',
  ].map((permission) => ({
    membershipId: 'membership-1',
    permission: permission as PermissionContext['permissions'][number]['permission'],
    effect: 'allow',
  })),
};

export function actorFixture(): Actor<Status> {
  return {
    id: 'actor-1',
    createdAt: new Date('2026-07-15T00:00:00.000Z'),
    updatedAt: new Date('2026-07-15T00:00:00.000Z'),
    status: 'active',
    type: 'USER',
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
    passwordHash: 'hashed-password',
    emailVerified: true,
    telephoneVerified: true,
  };
}

export function actorCompositionInput(
  repository = new ActorRepositoryMock(),
): ActorCompositionInput<Status> {
  return {
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    actorRepository: repository,
    verificationRepository: new VerificationRepositoryMock(),
    verification: verificationConfigMock(),
    auditRepository: new AuditRepositoryMock(),
    policy: {
      actorStatusPolicy: {
        isEnabled: (status) => status === 'active',
      },
    },
    permissionContext: actorPermissionContext,
  };
}
