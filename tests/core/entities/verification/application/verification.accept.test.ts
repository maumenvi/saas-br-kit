import assert from 'node:assert/strict';
import test from 'node:test';
import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { AcceptVerificationUseCase } from '../../../../../src/core/entities/verification/application/verification.accept.ts';
import type { Verification } from '../../../../../src/core/entities/verification/verification.ts';
import { Email } from '../../../../../src/core/entities/actor/domain/email.ts';
import { Telephone } from '../../../../../src/core/entities/actor/domain/telephone.ts';
import { ActorRepositoryMock } from '../../../../../src/mocks/actor.repository.ts';
import { DatabaseMock } from '../../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../../src/mocks/logger.ts';
import { MembershipRepositoryMock } from '../../../../../src/mocks/membership.repository.ts';
import { PasswordHashMock } from '../../../../../src/mocks/password.hash.ts';
import type { Status } from '../../../../../src/mocks/status.ts';
import { verificationConfigMock } from '../../../../../src/mocks/verification.credential.ts';
import { VerificationRepositoryMock } from '../../../../../src/mocks/verification.repository.ts';

const now = new Date('2026-07-22T12:00:00.000Z');

function verification(
  overrides: Partial<Verification<Status>> = {},
): Verification<Status> {
  return {
    id: 'verification-1',
    purpose: 'EMAIL_CONFIRMATION',
    channel: 'EMAIL',
    actorId: 'actor-1',
    organizationId: null,
    destination: 'actor@example.com',
    credentialHash: 'hash:credential-1',
    status: 'PENDING',
    attempts: 0,
    maxAttempts: 2,
    createdAt: now,
    expiresAt: new Date('2026-07-22T12:15:00.000Z'),
    acceptedAt: null,
    rejectedAt: null,
    expiredAt: null,
    ...overrides,
  } as Verification<Status>;
}

async function setup(item: Verification<Status>) {
  const actors = new ActorRepositoryMock();
  await actors.save({
    id: 'actor-1',
    createdAt: now,
    updatedAt: now,
    status: 'active',
    type: 'USER',
    name: 'Actor',
    email: new Email('actor@example.com'),
    telephone: new Telephone('+5511999999999'),
    passwordHash: 'hash',
    emailVerified: false,
    telephoneVerified: false,
  });
  const memberships = new MembershipRepositoryMock();
  const verifications = new VerificationRepositoryMock();
  await verifications.save(item);
  const useCase = new AcceptVerificationUseCase({
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
      clock: () => now,
    }),
    actorRepository: actors,
    membershipRepository: memberships,
    verificationRepository: verifications,
    config: verificationConfigMock(),
  });
  return { actors, memberships, verifications, useCase };
}

test('Aceita confirmação de email e aplica o efeito no actor', async () => {
  const { actors, verifications, useCase } = await setup(verification());
  const output = await useCase.execute({
    verificationId: 'verification-1',
    credential: 'credential-1',
  });
  assert.equal(output.accepted, true);
  assert.equal((await actors.findById('actor-1') as { emailVerified: boolean }).emailVerified, true);
  assert.equal(verifications.verifications[0]?.status, 'ACCEPTED');
  assert.deepEqual(verifications.verifications[0]?.acceptedAt, now);
});

test('Aceita confirmação de telefone e aplica o efeito no actor', async () => {
  const telephoneVerification = {
    ...verification(),
    purpose: 'TELEPHONE_CONFIRMATION' as const,
    channel: 'TELEPHONE' as const,
    destination: '+5511999999999',
  } as Verification<Status>;
  const { actors, useCase } = await setup(telephoneVerification);
  await useCase.execute({
    verificationId: 'verification-1',
    credential: 'credential-1',
  });
  const actor = await actors.findById('actor-1');
  assert.equal(actor?.type === 'USER' && actor.telephoneVerified, true);
});

test('Conta tentativa inválida e rejeita ao atingir o limite', async () => {
  const { verifications, useCase } = await setup(
    verification({ maxAttempts: 1 }),
  );
  await assert.rejects(
    useCase.execute({ verificationId: 'verification-1', credential: 'wrong' }),
    { code: 'VERIFICATION_REJECTED' },
  );
  assert.equal(verifications.verifications[0]?.attempts, 1);
  assert.equal(verifications.verifications[0]?.status, 'REJECTED');
});

test('Persiste EXPIRED quando o prazo já terminou', async () => {
  const { verifications, useCase } = await setup(
    verification({ expiresAt: new Date('2026-07-22T11:59:59.000Z') }),
  );
  await assert.rejects(
    useCase.execute({ verificationId: 'verification-1', credential: 'credential-1' }),
    { code: 'VERIFICATION_EXPIRED' },
  );
  assert.equal(verifications.verifications[0]?.status, 'EXPIRED');
  assert.deepEqual(verifications.verifications[0]?.expiredAt, now);
});

test('Aceita convite e cria a membership armazenada na verificação', async () => {
  const membership = {
    id: 'membership-1',
    actorId: 'actor-1',
    organizationId: 'organization-1',
    role: 'member',
    permissions: [],
    status: 'active' as const,
    createdAt: now,
    updatedAt: now,
  };
  const invitation = verification({
    purpose: 'ORGANIZATION_INVITATION',
    channel: 'EMAIL',
    organizationId: 'organization-1',
    membership,
  } as Partial<Verification<Status>>);
  const { memberships, useCase } = await setup(invitation);
  const output = await useCase.execute({
    verificationId: 'verification-1',
    credential: 'credential-1',
  });
  assert.equal(output.membershipId, 'membership-1');
  assert.equal((await memberships.findById('membership-1'))?.actorId, 'actor-1');
});
