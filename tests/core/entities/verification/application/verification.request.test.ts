import assert from 'node:assert/strict';
import test from 'node:test';
import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { RequestVerificationUseCase } from '../../../../../src/core/entities/verification/application/verification.request.ts';
import { DatabaseMock } from '../../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../../src/mocks/logger.ts';
import { PasswordHashMock } from '../../../../../src/mocks/password.hash.ts';
import { verificationConfigMock } from '../../../../../src/mocks/verification.credential.ts';
import { VerificationRepositoryMock } from '../../../../../src/mocks/verification.repository.ts';

test('Persiste expiresAt e invalida a solicitação pendente anterior no reenvio', async () => {
  const now = new Date('2026-07-22T12:00:00.000Z');
  let id = 0;
  const repository = new VerificationRepositoryMock();
  const useCase = new RequestVerificationUseCase({
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
      clock: () => now,
      idGenerator: () => `verification-${++id}`,
    }),
    verificationRepository: repository,
    config: verificationConfigMock(),
  });

  const first = await useCase.execute({
    purpose: 'EMAIL_CONFIRMATION',
    actorId: 'actor-1',
    destination: 'actor@example.com',
  });
  const second = await useCase.execute({
    purpose: 'EMAIL_CONFIRMATION',
    actorId: 'actor-1',
    destination: 'actor@example.com',
  });

  assert.equal(first.credential, 'credential-1');
  assert.equal(second.credential, 'credential-2');
  assert.equal(first.expiresAt.toISOString(), '2026-07-22T12:15:00.000Z');
  assert.equal(repository.verifications[0]?.status, 'EXPIRED');
  assert.equal(repository.verifications[1]?.status, 'PENDING');
  assert.equal(repository.verifications[1]?.credentialHash, 'hash:credential-2');
  assert.equal('credential' in (repository.verifications[1] ?? {}), false);
});

test('Rejeita configuração sem prazo positivo antes de persistir', async () => {
  const repository = new VerificationRepositoryMock();
  const config = verificationConfigMock();
  const useCase = new RequestVerificationUseCase({
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    verificationRepository: repository,
    config: {
      ...config,
      ttlMs: { ...config.ttlMs, EMAIL_CONFIRMATION: 0 },
    },
  });
  await assert.rejects(
    useCase.execute({
      purpose: 'EMAIL_CONFIRMATION',
      actorId: 'actor-1',
      destination: 'actor@example.com',
    }),
    { code: 'VERIFICATION_INVALID_CONFIG' },
  );
  assert.equal(repository.verifications.length, 0);
});
