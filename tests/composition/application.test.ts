import test from 'node:test';
import assert from 'node:assert/strict';
import { Aplication } from '../../src/composition/application.ts';
import { AppContext, CreateUserUseCase, Email, Telephone } from '../../src/core/index.ts';
import { DatabaseMock, LoggerMock, UserRepositoryMock } from '../../src/mocks/index.ts';

test('Compõe o contexto e os casos de uso da aplicação', async () => {
  const database = new DatabaseMock();
  const logger = new LoggerMock();
  const users = new UserRepositoryMock();
  const application = new Aplication({
    context: {
      executionContextInput: {
        databaseProvider: database,
        loggerProvider: logger,
      },
    },
    repositories: { user: users },
  });

  assert.ok(application.context instanceof AppContext);
  assert.ok(application.user.create instanceof CreateUserUseCase);

  const user = {
    id: 'user-1',
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
  };

  await application.user.create.execute(user);

  assert.deepEqual(users.users, [user]);
  assert.equal(database.commited, 1);
});
