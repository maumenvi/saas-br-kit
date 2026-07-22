import assert from 'node:assert/strict';
import test from 'node:test';
import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { ActorVerificationUseCase } from '../../../../../src/core/entities/actor/application/actor.verification.ts';
import { Email } from '../../../../../src/core/entities/actor/domain/email.ts';
import { Telephone } from '../../../../../src/core/entities/actor/domain/telephone.ts';
import { ActorRepositoryMock } from '../../../../../src/mocks/actor.repository.ts';
import { DatabaseMock } from '../../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../../src/mocks/logger.ts';
import { PasswordHashMock } from '../../../../../src/mocks/password.hash.ts';
import { verificationConfigMock } from '../../../../../src/mocks/verification.credential.ts';
import { VerificationRepositoryMock } from '../../../../../src/mocks/verification.repository.ts';

test('Solicita confirmação usando os contatos atuais do USER', async () => {
  const actors = new ActorRepositoryMock();
  await actors.save({
    id: 'actor-1', createdAt: new Date(), updatedAt: new Date(), status: 'active',
    type: 'USER', name: 'Actor', email: new Email('actor@example.com'),
    telephone: new Telephone('+5511999999999'), passwordHash: 'hash',
    emailVerified: false, telephoneVerified: false,
  });
  const verifications = new VerificationRepositoryMock();
  const useCase = new ActorVerificationUseCase({
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(), loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(), idGenerator: () => 'verification-1',
      clock: () => new Date('2026-07-22T12:00:00.000Z'),
    }),
    actorRepository: actors,
    verificationRepository: verifications,
    config: verificationConfigMock(),
  });
  const output = await useCase.requestEmailConfirmation({ actorId: 'actor-1' });
  assert.equal(output.verificationId, 'verification-1');
  assert.equal(verifications.verifications[0]?.destination, 'actor@example.com');
});

test('Não cria solicitação para contato já confirmado', async () => {
  const actors = new ActorRepositoryMock();
  await actors.save({
    id: 'actor-1', createdAt: new Date(), updatedAt: new Date(), status: 'active',
    type: 'USER', name: 'Actor', email: new Email('actor@example.com'),
    telephone: new Telephone('+5511999999999'), passwordHash: 'hash',
    emailVerified: true, telephoneVerified: true,
  });
  const useCase = new ActorVerificationUseCase({
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(), loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    actorRepository: actors,
    verificationRepository: new VerificationRepositoryMock(),
    config: verificationConfigMock(),
  });
  await assert.rejects(
    useCase.requestTelephoneConfirmation({ actorId: 'actor-1' }),
    { code: 'VERIFICATION_CONTACT_ALREADY_VERIFIED' },
  );
});
