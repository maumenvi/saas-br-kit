import test from 'node:test';
import assert from 'node:assert/strict';
import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { ChangeActorStatusUseCase } from '../../../../../src/core/entities/actor/application/actor.change.status.ts';
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
    telephoneVerified: true,
  };
}

test('Altera o status do actor dentro da transação', async () => {
  const database = new DatabaseMock();
  const actors = new ActorRepositoryMock();
  const useCase = new ChangeActorStatusUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock()
    }),
    actors,
  );
  const actor = validActor();
  await actors.save(actor);

  await useCase.changeStatus(actor);

  assert.equal(actors.actors[0]?.status, 'inactive');
  assert.equal(database.started, 1);
  assert.equal(database.commited, 1);
  assert.equal(database.rolledback, 0);
});

test('Propaga falha ao alterar status e registra rollback', async () => {
  const failure = new Error('Repository failed');
  const database = new DatabaseMock();
  const actors: ActorRepositoryPort<Status> = new ActorRepositoryMock();
  actors.changeStatus = async () => {
    throw failure;
  };
  const useCase = new ChangeActorStatusUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock()
    }),
    actors,
  );

  await assert.rejects(useCase.changeStatus(validActor()), (error) => error === failure);
  assert.equal(database.started, 1);
  assert.equal(database.commited, 0);
  assert.equal(database.rolledback, 1);
});
