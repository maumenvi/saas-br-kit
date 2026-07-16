import test from 'node:test';
import assert from 'node:assert/strict';
import { ExecutionContext } from '../../../../../../src/core/context/execution.context.ts';
import { DomainError } from '../../../../../../src/core/shared/domain/domain.error.ts';
import { UpdateUserUseCase } from '../../../../../../src/core/entities/user/application/use-cases/user.update.ts';
import { Email } from '../../../../../../src/core/entities/user/domain/email.ts';
import { Telephone } from '../../../../../../src/core/entities/user/domain/telephone.ts';
import type { UserRepositoryPort } from '../../../../../../src/core/entities/user/user.repositories.ts';
import { DatabaseMock } from '../../../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../../../src/mocks/logger.ts';
import type { Status } from '../../../../../../src/mocks/status.ts';
import { UserRepositoryMock } from '../../../../../../src/mocks/user.repository.ts';

function validUser() {
  return {
    id: 'user-1',
    createdAt: new Date('2026-07-13T00:00:00.000Z'),
    updatedAt: new Date('2026-07-13T00:00:00.000Z'),
    status: 'active' as Status,
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
  };
}

function setup(users: UserRepositoryPort<Status> = new UserRepositoryMock()) {
  const database = new DatabaseMock();
  const useCase = new UpdateUserUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
    }),
    users,
  );

  return { database, useCase };
}

test('Valida e atualiza o usuário dentro da transação', async () => {
  const users = new UserRepositoryMock();
  const currentUser = validUser();
  await users.save(currentUser);
  const updatedUser = {
    ...currentUser,
    updatedAt: new Date('2026-07-13T12:00:00.000Z'),
    name: 'Marco Aurelio',
  };
  const { database, useCase } = setup(users);

  await useCase.update(updatedUser);

  assert.deepEqual(users.users, [updatedUser]);
  assert.equal(database.started, 1);
  assert.equal(database.commited, 1);
  assert.equal(database.rolledback, 0);
});

test('Não inicia transação quando o e-mail é inválido', async () => {
  const users = new UserRepositoryMock();
  const currentUser = validUser();
  await users.save(currentUser);
  const { database, useCase } = setup(users);
  const invalidUser = {
    ...currentUser,
    email: new Email('invalid-email'),
  };

  await assert.rejects(
    useCase.update(invalidUser),
    (error) => error instanceof DomainError && error.code === 'USER_INVALID_EMAIL',
  );
  assert.deepEqual(users.users, [currentUser]);
  assert.equal(database.started, 0);
});

test('Não inicia transação quando o telefone é inválido', async () => {
  const users = new UserRepositoryMock();
  const currentUser = validUser();
  await users.save(currentUser);
  const { database, useCase } = setup(users);
  const invalidUser = {
    ...currentUser,
    telephone: new Telephone('11999999999'),
  };

  await assert.rejects(
    useCase.update(invalidUser),
    (error) => error instanceof DomainError && error.code === 'USER_INVALID_PHONE',
  );
  assert.deepEqual(users.users, [currentUser]);
  assert.equal(database.started, 0);
});

test('Propaga falha da atualização e registra rollback', async () => {
  const failure = new Error('Repository failed');
  const users: UserRepositoryPort<Status> = new UserRepositoryMock();
  users.update = async () => {
    throw failure;
  };
  const { database, useCase } = setup(users);

  await assert.rejects(useCase.update(validUser()), (error) => error === failure);
  assert.equal(database.started, 1);
  assert.equal(database.commited, 0);
  assert.equal(database.rolledback, 1);
});
