import test from 'node:test';
import assert from 'node:assert/strict';
import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { DomainError } from '../../../../../src/core/shared/domain/domain.error.ts';
import { UpdateActorUseCase } from '../../../../../src/core/entities/actor/application/actor.update.ts';
import { Email } from '../../../../../src/core/entities/actor/domain/email.ts';
import { Telephone } from '../../../../../src/core/entities/actor/domain/telephone.ts';
import type { ActorRepositoryPort } from '../../../../../src/core/entities/actor/actor.repositories.ts';
import { DatabaseMock } from '../../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../../src/mocks/logger.ts';
import type { Status } from '../../../../../src/mocks/status.ts';
import { ActorRepositoryMock } from '../../../../../src/mocks/actor.repository.ts';
import { PasswordHashMock } from '../../../../../src/mocks/password.hash.ts';

function validActor() {
  return {
    id: 'user-1',
    createdAt: new Date('2026-07-13T00:00:00.000Z'),
    updatedAt: new Date('2026-07-13T00:00:00.000Z'),
    status: 'active' as Status,
    type: 'USER' as const,
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
    passwordHash: 'hashed-password',
    emailVerified: true,
  };
}

function setup(actors: ActorRepositoryPort<Status> = new ActorRepositoryMock()) {
  const database = new DatabaseMock();
  const useCase = new UpdateActorUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    actors,
  );

  return { database, useCase };
}

test('Valida e atualiza o actor dentro da transação', async () => {
  const actors = new ActorRepositoryMock();
  const currentActor = validActor();
  await actors.save(currentActor);
  const updatedActor = {
    ...currentActor,
    updatedAt: new Date('2026-07-13T12:00:00.000Z'),
    name: 'Marco Aurelio',
  };
  const { database, useCase } = setup(actors);

  await useCase.update(updatedActor);

  assert.deepEqual(actors.actors, [updatedActor]);
  assert.equal(database.started, 1);
  assert.equal(database.commited, 1);
  assert.equal(database.rolledback, 0);
});

test('Não inicia transação quando o e-mail é inválido', async () => {
  const actors = new ActorRepositoryMock();
  const currentActor = validActor();
  await actors.save(currentActor);
  const { database, useCase } = setup(actors);
  const invalidActor = {
    ...currentActor,
    email: new Email('invalid-email'),
  };

  await assert.rejects(
    useCase.update(invalidActor),
    (error) => error instanceof DomainError && error.code === 'ACTOR_INVALID_EMAIL',
  );
  assert.deepEqual(actors.actors, [currentActor]);
  assert.equal(database.started, 0);
});

test('Não inicia transação quando o telefone é inválido', async () => {
  const actors = new ActorRepositoryMock();
  const currentActor = validActor();
  await actors.save(currentActor);
  const { database, useCase } = setup(actors);
  const invalidActor = {
    ...currentActor,
    telephone: new Telephone('11999999999'),
  };

  await assert.rejects(
    useCase.update(invalidActor),
    (error) => error instanceof DomainError && error.code === 'ACTOR_INVALID_PHONE',
  );
  assert.deepEqual(actors.actors, [currentActor]);
  assert.equal(database.started, 0);
});

test('Propaga falha da atualização e registra rollback', async () => {
  const failure = new Error('Repository failed');
  const actors: ActorRepositoryPort<Status> = new ActorRepositoryMock();
  actors.update = async () => {
    throw failure;
  };
  const { database, useCase } = setup(actors);

  await assert.rejects(useCase.update(validActor()), (error) => error === failure);
  assert.equal(database.started, 1);
  assert.equal(database.commited, 0);
  assert.equal(database.rolledback, 1);
});
