import assert from 'node:assert/strict';
import test from 'node:test';
import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { ValidateMfaCodeUseCase } from '../../../../../src/core/entities/mfa/application/mfa.validate-code.ts';
import type { Mfa, MfaStatus } from '../../../../../src/core/entities/mfa/mfa.ts';
import { DatabaseMock } from '../../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../../src/mocks/logger.ts';
import { MfaProviderMock } from '../../../../../src/mocks/mfa.provider.ts';
import { MfaRepositoryMock } from '../../../../../src/mocks/mfa.repository.ts';
import { PasswordHashMock } from '../../../../../src/mocks/password.hash.ts';

function mfaFixture(status: MfaStatus = 'PENDING'): Mfa {
  return {
    id: 'mfa-1',
    actorId: 'actor-1',
    method: 'TOTP',
    status,
    providerCredential: 'protected-secret',
    lastUsedCounter: null,
    createdAt: new Date('2026-07-22T00:00:00.000Z'),
    updatedAt: new Date('2026-07-22T00:00:00.000Z'),
    activatedAt: status === 'ACTIVE' ? new Date('2026-07-22T01:00:00.000Z') : null,
  };
}

function setup() {
  const database = new DatabaseMock();
  const repository = new MfaRepositoryMock();
  const provider = new MfaProviderMock();
  const useCase = new ValidateMfaCodeUseCase({
    executionContext: new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
      clock: () => new Date('2026-07-22T15:00:00.000Z'),
    }),
    mfaRepository: repository,
    mfaProvider: provider,
  });
  return { database, provider, repository, useCase };
}

test('Ativa uma chave pendente depois do primeiro código válido', async () => {
  const { database, repository, useCase } = setup();
  await repository.save(mfaFixture());

  assert.deepEqual(
    await useCase.execute({ actorId: 'actor-1', code: '123456' }),
    { valid: true, activated: true },
  );
  assert.equal(repository.mfas[0]?.status, 'ACTIVE');
  assert.equal(repository.mfas[0]?.lastUsedCounter, 1);
  assert.equal(database.commited, 1);
});

test('Consome contador novo e rejeita reutilização', async () => {
  const { database, provider, repository, useCase } = setup();
  await repository.save(mfaFixture('ACTIVE'));
  provider.counter = 2;

  assert.deepEqual(
    await useCase.execute({ actorId: 'actor-1', code: '123456' }),
    { valid: true, activated: false },
  );
  await assert.rejects(
    useCase.execute({ actorId: 'actor-1', code: '123456' }),
    { code: 'MFA_CODE_REUSED' },
  );
  assert.equal(repository.mfas[0]?.lastUsedCounter, 2);
  assert.equal(database.rolledback, 1);
});

test('Rejeita código inválido antes de abrir transação', async () => {
  const { database, repository, useCase } = setup();
  await repository.save(mfaFixture('ACTIVE'));

  await assert.rejects(
    useCase.execute({ actorId: 'actor-1', code: '000000' }),
    { code: 'MFA_INVALID_CODE' },
  );
  assert.equal(database.started, 0);
});

test('Rejeita MFA ausente ou desabilitado', async () => {
  const missing = setup();
  await assert.rejects(
    missing.useCase.execute({ actorId: 'actor-1', code: '123456' }),
    { code: 'MFA_NOT_CONFIGURED' },
  );

  const disabled = setup();
  await disabled.repository.save(mfaFixture('DISABLED'));
  await assert.rejects(
    disabled.useCase.execute({ actorId: 'actor-1', code: '123456' }),
    { code: 'MFA_NOT_ACTIVE' },
  );
});
