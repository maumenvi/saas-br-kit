import assert from 'node:assert/strict';
import test from 'node:test';
import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { ExpireVerificationsUseCase } from '../../../../../src/core/entities/verification/application/verification.expire.ts';
import { DatabaseMock } from '../../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../../src/mocks/logger.ts';
import { PasswordHashMock } from '../../../../../src/mocks/password.hash.ts';
import { VerificationRepositoryMock } from '../../../../../src/mocks/verification.repository.ts';

test('Expira em lote somente verificações pendentes vencidas', async () => {
  const now = new Date('2026-07-22T12:00:00.000Z');
  const repository = new VerificationRepositoryMock();
  await repository.save({
    id: 'verification-1', purpose: 'EMAIL_CONFIRMATION', channel: 'EMAIL',
    actorId: 'actor-1', organizationId: null, destination: 'a@example.com',
    credentialHash: 'hash', status: 'PENDING', attempts: 0, maxAttempts: 3,
    createdAt: now, expiresAt: new Date('2026-07-22T11:59:00.000Z'),
    acceptedAt: null, rejectedAt: null, expiredAt: null,
  });
  const useCase = new ExpireVerificationsUseCase(
    new ExecutionContext({
      databaseProvider: new DatabaseMock(), loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(), clock: () => now,
    }),
    repository,
  );
  assert.equal(await useCase.execute(), 1);
  assert.equal(repository.verifications[0]?.status, 'EXPIRED');
});
