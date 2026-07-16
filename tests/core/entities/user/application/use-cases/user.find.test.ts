import test from 'node:test';
import assert from 'node:assert/strict';
import { ExecutionContext } from '../../../../../../src/core/context/execution.context.ts';
import { FindUserByIdUseCase } from '../../../../../../src/core/entities/user/application/use-cases/user.find.ts';
import { Email } from '../../../../../../src/core/entities/user/domain/email.ts';
import { Telephone } from '../../../../../../src/core/entities/user/domain/telephone.ts';
import type { UserRepositoryPort } from '../../../../../../src/core/entities/user/user.repositories.ts';
import { DatabaseMock } from '../../../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../../../src/mocks/logger.ts';
import type { Status } from '../../../../../../src/mocks/status.ts';
import { UserRepositoryMock } from '../../../../../../src/mocks/user.repository.ts';

function validUser(id = 'user-1', email = 'marco@example.com', telephone = '+5511999999999') {
  return {
    id,
    createdAt: new Date('2026-07-13T00:00:00.000Z'),
    updatedAt: new Date('2026-07-13T00:00:00.000Z'),
    status: 'active' as Status,
    name: 'Marco',
    email: new Email(email),
    telephone: new Telephone(telephone),
  };
}

function setup(users: UserRepositoryPort<Status> = new UserRepositoryMock()) {
  const database = new DatabaseMock();
  const useCase = new FindUserByIdUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
    }),
    users,
  );

  return { database, useCase, users };
}

test('Localiza usuários por id, e-mail, telefone e nome', async () => {
  const users = new UserRepositoryMock();
  const firstUser = validUser();
  const secondUser = validUser('user-2', 'outro@example.com', '+5511888888888');
  await users.save(firstUser);
  await users.save(secondUser);
  const { database, useCase } = setup(users);

  assert.equal(await useCase.findById(firstUser.id), firstUser);
  assert.equal(await useCase.findByEmail(firstUser.email.value), firstUser);
  assert.equal(await useCase.findByTelephone(firstUser.telephone.value), firstUser);
  assert.deepEqual(await useCase.findByName(firstUser.name), [firstUser, secondUser]);
  assert.equal(database.started, 4);
  assert.equal(database.commited, 4);
  assert.equal(database.rolledback, 0);
});

test('Retorna resultados vazios quando o usuário não existe', async () => {
  const { database, useCase } = setup();

  assert.equal(await useCase.findById('missing-user'), null);
  assert.equal(await useCase.findByEmail('missing@example.com'), null);
  assert.equal(await useCase.findByTelephone('+5511777777777'), null);
  assert.deepEqual(await useCase.findByName('Missing'), []);
  assert.equal(database.started, 4);
  assert.equal(database.commited, 4);
  assert.equal(database.rolledback, 0);
});

test('Propaga falha da consulta e registra rollback', async () => {
  const failure = new Error('Repository failed');
  const users: UserRepositoryPort<Status> = new UserRepositoryMock();
  users.findById = async () => {
    throw failure;
  };
  const { database, useCase } = setup(users);

  await assert.rejects(useCase.findById('user-1'), (error) => error === failure);
  assert.equal(database.started, 1);
  assert.equal(database.commited, 0);
  assert.equal(database.rolledback, 1);
});
