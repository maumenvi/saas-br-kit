import assert from 'node:assert/strict';
import test from 'node:test';
import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { Email } from '../../../../../src/core/entities/actor/domain/email.ts';
import { Telephone } from '../../../../../src/core/entities/actor/domain/telephone.ts';
import { CreateMfaKeyUseCase } from '../../../../../src/core/entities/mfa/application/mfa.create-key.ts';
import { ActorRepositoryMock } from '../../../../../src/mocks/actor.repository.ts';
import { DatabaseMock } from '../../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../../src/mocks/logger.ts';
import { MfaProviderMock } from '../../../../../src/mocks/mfa.provider.ts';
import { MfaRepositoryMock } from '../../../../../src/mocks/mfa.repository.ts';
import { PasswordHashMock } from '../../../../../src/mocks/password.hash.ts';
import { PolicyActor, type Status } from '../../../../../src/mocks/status.ts';

function setup() {
  const database = new DatabaseMock();
  const actors = new ActorRepositoryMock();
  const mfas = new MfaRepositoryMock();
  const provider = new MfaProviderMock();
  const useCase = new CreateMfaKeyUseCase({
    executionContext: new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
      clock: () => new Date('2026-07-22T15:00:00.000Z'),
      idGenerator: () => 'mfa-1',
    }),
    actorRepository: actors,
    actorStatusPolicy: new PolicyActor(),
    mfaRepository: mfas,
    mfaProvider: provider,
  });
  return { actors, database, mfas, provider, useCase };
}

async function saveUser(actors: ActorRepositoryMock, status: Status = 'active') {
  await actors.save({
    id: 'actor-1',
    createdAt: new Date('2026-07-22T00:00:00.000Z'),
    updatedAt: new Date('2026-07-22T00:00:00.000Z'),
    status,
    type: 'USER',
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
    passwordHash: 'hashed-secret',
    emailVerified: true,
    telephoneVerified: true,
  });
}

test('Cria uma chave pendente para UserActor habilitado', async () => {
  const { actors, database, mfas, provider, useCase } = setup();
  await saveUser(actors);

  const output = await useCase.execute({ actorId: 'actor-1', issuer: 'SaaS BR' });

  assert.equal(mfas.mfas[0]?.actorId, 'actor-1');
  assert.equal(mfas.mfas[0]?.status, 'PENDING');
  assert.equal(mfas.mfas[0]?.providerCredential, 'protected-secret-marco@example.com');
  assert.equal(mfas.mfas[0]?.lastUsedCounter, null);
  assert.deepEqual(provider.createKeyInputs, [{
    issuer: 'SaaS BR',
    label: 'marco@example.com',
  }]);
  assert.deepEqual(output, {
    secret: 'secret-marco@example.com',
    provisioningUri: 'otpauth://totp/SaaS BR:marco@example.com?secret=secret-marco@example.com',
  });
  assert.equal(database.commited, 1);
});

test('Rejeita actor ausente, não USER ou desabilitado antes de gerar a chave', async () => {
  const missing = setup();
  await assert.rejects(
    missing.useCase.execute({ actorId: 'missing', issuer: 'SaaS BR' }),
    { code: 'MFA_ACTOR_NOT_FOUND' },
  );

  const client = setup();
  await client.actors.save({
    id: 'actor-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'active',
    type: 'CLIENT',
    name: 'Client',
  });
  await assert.rejects(
    client.useCase.execute({ actorId: 'actor-1', issuer: 'SaaS BR' }),
    { code: 'MFA_ACTOR_TYPE_NOT_ALLOWED' },
  );

  const disabled = setup();
  await saveUser(disabled.actors, 'inactive');
  await assert.rejects(
    disabled.useCase.execute({ actorId: 'actor-1', issuer: 'SaaS BR' }),
    { code: 'MFA_ACTOR_NOT_ENABLED' },
  );

  assert.equal(missing.provider.createKeyInputs.length, 0);
  assert.equal(client.provider.createKeyInputs.length, 0);
  assert.equal(disabled.provider.createKeyInputs.length, 0);
});

test('Não substitui configuração pendente ou ativa', async () => {
  const { actors, database, provider, useCase } = setup();
  await saveUser(actors);
  await useCase.execute({ actorId: 'actor-1', issuer: 'SaaS BR' });

  await assert.rejects(
    useCase.execute({ actorId: 'actor-1', issuer: 'SaaS BR' }),
    { code: 'MFA_ALREADY_CONFIGURED' },
  );

  assert.equal(provider.createKeyInputs.length, 1);
  assert.equal(database.started, 1);
});

test('Propaga falha de persistência e registra rollback', async () => {
  const { actors, database, mfas, useCase } = setup();
  const failure = new Error('MFA repository failed');
  await saveUser(actors);
  mfas.save = async () => {
    throw failure;
  };

  await assert.rejects(
    useCase.execute({ actorId: 'actor-1', issuer: 'SaaS BR' }),
    (error) => error === failure,
  );

  assert.equal(database.commited, 0);
  assert.equal(database.rolledback, 1);
});
