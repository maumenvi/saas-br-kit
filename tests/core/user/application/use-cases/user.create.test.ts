import test from 'node:test';
import assert from 'node:assert/strict';
import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { DomainError } from '../../../../../src/core/shared/domain/domain.error.ts';
import { CreateUserUseCase } from '../../../../../src/core/user/application/use-cases/user.create.ts';
import { Email } from '../../../../../src/core/user/domain/email.ts';
import { Telephone } from '../../../../../src/core/user/domain/telephone.ts';
import type { UserRepositoryPort } from '../../../../../src/core/ports/repositories/user.repositories.ts';
import { DatabaseMock, LoggerMock, UserRepositoryMock } from '../../../../../src/mocks/index.ts';

function validUser() {
  return {
    id: 'user-1',
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
  };
}

test('Valida e salva usuário dentro da transação', async () => {
  const database = new DatabaseMock();
  const users = new UserRepositoryMock();
  const useCase = new CreateUserUseCase(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
    }),
    users,
  );
  const user = validUser();

  await useCase.execute(user);

  assert.deepEqual(users.users, [user]);
  assert.equal(database.started, 1);
  assert.equal(database.commited, 1);
  assert.equal(database.rolledback, 0);
});

test('Não inicia transação quando o usuário é inválido', async () => {
  const database = new DatabaseMock();
  const users = new UserRepositoryMock();
  const useCase = new CreateUserUseCase(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
    }),
    users,
  );
  const user = {
    ...validUser(),
    email: new Email('invalid-email'),
  };

  await assert.rejects(
    useCase.execute(user),
    (error) => error instanceof DomainError && error.code === 'USER_INVALID_EMAIL',
  );
  assert.equal(database.started, 0);
  assert.deepEqual(users.users, []);
});

test('Propaga falha do repository e registra rollback', async () => {
  const failure = new Error('Repository failed');
  const database = new DatabaseMock();
  const users: UserRepositoryPort = {
    async save() {
      throw failure;
    },
  };
  const useCase = new CreateUserUseCase(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
    }),
    users,
  );

  await assert.rejects(useCase.execute(validUser()), (error) => error === failure);
  assert.equal(database.started, 1);
  assert.equal(database.commited, 0);
  assert.equal(database.rolledback, 1);
});
