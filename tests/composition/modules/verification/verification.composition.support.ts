import { ExecutionContext } from '../../../../src/core/context/execution.context.ts';
import { Email } from '../../../../src/core/entities/actor/domain/email.ts';
import { Telephone } from '../../../../src/core/entities/actor/domain/telephone.ts';
import { ActorRepositoryMock } from '../../../../src/mocks/actor.repository.ts';
import { AuditRepositoryMock } from '../../../../src/mocks/audit.repository.ts';
import { DatabaseMock } from '../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../src/mocks/logger.ts';
import { MembershipRepositoryMock } from '../../../../src/mocks/membership.repository.ts';
import { PasswordHashMock } from '../../../../src/mocks/password.hash.ts';
import { verificationConfigMock } from '../../../../src/mocks/verification.credential.ts';
import { VerificationRepositoryMock } from '../../../../src/mocks/verification.repository.ts';

export async function verificationCompositionInput() {
  const now = new Date('2026-07-22T12:00:00.000Z');
  const actors = new ActorRepositoryMock();
  await actors.save({
    id: 'actor-1', createdAt: now, updatedAt: now, status: 'active', type: 'USER',
    name: 'Actor', email: new Email('actor@example.com'),
    telephone: new Telephone('+5511999999999'), passwordHash: 'hash',
    emailVerified: false, telephoneVerified: false,
  });
  return {
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(), loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(), clock: () => now,
    }),
    actorRepository: actors,
    membershipRepository: new MembershipRepositoryMock(),
    verificationRepository: new VerificationRepositoryMock(),
    verification: verificationConfigMock(),
    auditRepository: new AuditRepositoryMock(),
  };
}

export function pendingEmailVerification() {
  return {
    id: 'verification-1', purpose: 'EMAIL_CONFIRMATION' as const,
    channel: 'EMAIL' as const, actorId: 'actor-1', organizationId: null,
    destination: 'actor@example.com', credentialHash: 'hash:credential-1',
    status: 'PENDING' as const, attempts: 0, maxAttempts: 3,
    createdAt: new Date('2026-07-22T12:00:00.000Z'),
    expiresAt: new Date('2026-07-22T12:15:00.000Z'),
    acceptedAt: null, rejectedAt: null, expiredAt: null,
  };
}
