import test from 'node:test';
import assert from 'node:assert/strict';
import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { DomainError } from '../../../../../src/core/shared/domain/domain.error.ts';
import { CreateUserUseCase } from '../../../../../src/core/entities/user/application/user.create.ts';
import { Email } from '../../../../../src/core/entities/user/domain/email.ts';
import { Telephone } from '../../../../../src/core/entities/user/domain/telephone.ts';
import type { UserRepositoryPort } from '../../../../../src/core/entities/user/user.repositories.ts';
import { DatabaseMock } from '../../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../../src/mocks/logger.ts';
import type { Status } from '../../../../../src/mocks/status.ts';
import { UserRepositoryMock } from '../../../../../src/mocks/user.repository.ts';
import { PasswordHashMock } from '../../../../../src/mocks/password.hash.ts';

function validUser() {
  return {
    id: 'user-1',
    createdAt: new Date('2026-07-13T00:00:00.000Z'),
    updatedAt: new Date('2026-07-13T00:00:00.000Z'),
    status: 'active' as Status,
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
    passwordHash: 'hashed-password',
    emailVerified: true,
  };
}

test('Valida e salva usuário dentro da transação', async () => {
  const database = new DatabaseMock();
  const users = new UserRepositoryMock();
  const useCase = new CreateUserUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock()
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
  const useCase = new CreateUserUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock()
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
  const users: UserRepositoryPort<Status> = new UserRepositoryMock();
  users.save = async () => {
    throw failure;
  };
  const useCase = new CreateUserUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock()
    }),
    users,
  );

  await assert.rejects(useCase.execute(validUser()), (error) => error === failure);
  assert.equal(database.started, 1);
  assert.equal(database.commited, 0);
  assert.equal(database.rolledback, 1);
});
