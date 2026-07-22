import { ExecutionContext } from '../../../../src/core/context/execution.context.ts';
import { Email } from '../../../../src/core/entities/actor/domain/email.ts';
import { Telephone } from '../../../../src/core/entities/actor/domain/telephone.ts';
import type { Membership } from '../../../../src/core/entities/membership/membership.ts';
import { ActorRepositoryMock } from '../../../../src/mocks/actor.repository.ts';
import { AuditRepositoryMock } from '../../../../src/mocks/audit.repository.ts';
import { DatabaseMock } from '../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../src/mocks/logger.ts';
import { MfaProviderMock } from '../../../../src/mocks/mfa.provider.ts';
import { MfaRepositoryMock } from '../../../../src/mocks/mfa.repository.ts';
import { PasswordHashMock } from '../../../../src/mocks/password.hash.ts';
import { PolicyActor, type Status } from '../../../../src/mocks/status.ts';

export function permissionContext(): Membership<Status> {
  return {
    id: 'membership-1',
    actorId: 'actor-1',
    organizationId: 'organization-1',
    role: 'owner',
    permissions: [],
    status: 'active',
    createdAt: new Date('2026-07-22T00:00:00.000Z'),
    updatedAt: new Date('2026-07-22T00:00:00.000Z'),
  };
}

export function mfaCompositionInput() {
  return {
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
      idGenerator: () => 'mfa-1',
      clock: () => new Date('2026-07-22T15:00:00.000Z'),
    }),
    auditRepository: new AuditRepositoryMock(),
    actorRepository: new ActorRepositoryMock(),
    actorStatusPolicy: new PolicyActor(),
    mfaRepository: new MfaRepositoryMock(),
    mfaProvider: new MfaProviderMock(),
    issuer: 'SaaS BR',
    permissionContext: permissionContext(),
  };
}

export async function saveUser(repository: ActorRepositoryMock) {
  await repository.save({
    id: 'actor-1',
    createdAt: new Date('2026-07-22T00:00:00.000Z'),
    updatedAt: new Date('2026-07-22T00:00:00.000Z'),
    status: 'active',
    type: 'USER',
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
    passwordHash: 'hashed-secret',
    emailVerified: true,
  });
}
