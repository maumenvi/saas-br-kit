import test from 'node:test';
import assert from 'node:assert/strict';
import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { FindActorUseCase } from '../../../../../src/core/entities/actor/application/actor.find.ts';
import { Email } from '../../../../../src/core/entities/actor/domain/email.ts';
import { Telephone } from '../../../../../src/core/entities/actor/domain/telephone.ts';
import type { ActorRepositoryPort } from '../../../../../src/core/entities/actor/actor.repositories.ts';
import { DatabaseMock } from '../../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../../src/mocks/logger.ts';
import type { Status } from '../../../../../src/mocks/status.ts';
import { ActorRepositoryMock } from '../../../../../src/mocks/actor.repository.ts';
import { PasswordHashMock } from '../../../../../src/mocks/password.hash.ts';

function validActor(id = 'actor-1', email = 'marco@example.com', telephone = '+5511999999999') {
  return {
    id,
    createdAt: new Date('2026-07-13T00:00:00.000Z'),
    updatedAt: new Date('2026-07-13T00:00:00.000Z'),
    status: 'active' as Status,
    type: 'USER' as const,
    name: 'Marco',
    email: new Email(email),
    telephone: new Telephone(telephone),
    passwordHash: 'hashed-password',
    emailVerified: true,
    telephoneVerified: true,
  };
}

function setup(actors: ActorRepositoryPort<Status> = new ActorRepositoryMock()) {
  const database = new DatabaseMock();
  const useCase = new FindActorUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    actors,
  );

  return { actors, database, useCase };
}

test('Localiza actors por id, e-mail, telefone e nome', async () => {
  const actors = new ActorRepositoryMock();
  const firstActor = validActor();
  const secondActor = validActor('actor-2', 'outro@example.com', '+5511888888888');
  await actors.save(firstActor);
  await actors.save(secondActor);
  const { database, useCase } = setup(actors);

  assert.equal(await useCase.findById(firstActor.id), firstActor);
  assert.equal(await useCase.findByEmail(firstActor.email.value), firstActor);
  assert.equal(await useCase.findByTelephone(firstActor.telephone.value), firstActor);
  assert.deepEqual(await useCase.findByName(firstActor.name), [firstActor, secondActor]);
  assert.equal(database.started, 4);
  assert.equal(database.commited, 4);
  assert.equal(database.rolledback, 0);
});

test('Retorna resultados vazios quando o actor não existe', async () => {
  const { database, useCase } = setup();

  assert.equal(await useCase.findById('missing-actor'), null);
  assert.equal(await useCase.findByEmail('missing@example.com'), null);
  assert.equal(await useCase.findByTelephone('+5511777777777'), null);
  assert.deepEqual(await useCase.findByName('Missing'), []);
  assert.equal(database.started, 4);
  assert.equal(database.commited, 4);
  assert.equal(database.rolledback, 0);
});

test('Propaga falha da consulta e registra rollback', async () => {
  const failure = new Error('Repository failed');
  const actors: ActorRepositoryPort<Status> = new ActorRepositoryMock();
  actors.findById = async () => {
    throw failure;
  };
  const { database, useCase } = setup(actors);

  await assert.rejects(useCase.findById('actor-1'), (error) => error === failure);
  assert.equal(database.started, 1);
  assert.equal(database.commited, 0);
  assert.equal(database.rolledback, 1);
});
