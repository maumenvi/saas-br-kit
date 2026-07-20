import test from 'node:test';
import assert from 'node:assert/strict';
import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { DomainError } from '../../../../../src/core/shared/domain/domain.error.ts';
import { CreateActorUseCase } from '../../../../../src/core/entities/actor/application/actor.create.ts';
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
    id: 'actor-1',
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

test('Valida e salva actor USER dentro da transação', async () => {
  const database = new DatabaseMock();
  const actors = new ActorRepositoryMock();
  const useCase = new CreateActorUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock()
    }),
    actors,
  );
  const actor = validActor();

  await useCase.execute(actor);

  assert.deepEqual(actors.actors, [actor]);
  assert.equal(database.started, 1);
  assert.equal(database.commited, 1);
  assert.equal(database.rolledback, 0);
});

test('Não inicia transação quando o actor USER é inválido', async () => {
  const database = new DatabaseMock();
  const actors = new ActorRepositoryMock();
  const useCase = new CreateActorUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock()
    }),
    actors,
  );
  const actor = {
    ...validActor(),
    email: new Email('invalid-email'),
  };

  await assert.rejects(
    useCase.execute(actor),
    (error) => error instanceof DomainError && error.code === 'ACTOR_INVALID_EMAIL',
  );
  assert.equal(database.started, 0);
  assert.deepEqual(actors.actors, []);
});

test('Salva actors CLIENT e SERVICE sem validações exclusivas de USER', async () => {
  const actors = new ActorRepositoryMock();
  const useCase = new CreateActorUseCase<Status>(
    new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    actors,
  );
  const client = { ...validActor(), id: 'client-1', type: 'CLIENT' as const };
  const service = { ...validActor(), id: 'service-1', type: 'SERVICE' as const };

  await useCase.execute(client);
  await useCase.execute(service);

  assert.deepEqual(actors.actors, [client, service]);
});

test('Propaga falha do repository e registra rollback', async () => {
  const failure = new Error('Repository failed');
  const database = new DatabaseMock();
  const actors: ActorRepositoryPort<Status> = new ActorRepositoryMock();
  actors.save = async () => {
    throw failure;
  };
  const useCase = new CreateActorUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock()
    }),
    actors,
  );

  await assert.rejects(useCase.execute(validActor()), (error) => error === failure);
  assert.equal(database.started, 1);
  assert.equal(database.commited, 0);
  assert.equal(database.rolledback, 1);
});
