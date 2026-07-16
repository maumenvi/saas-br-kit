import test from 'node:test';
import assert from 'node:assert/strict';
import { AppContext } from '../../../src/core/context/app.context.ts';
import { ExecutionContext } from '../../../src/core/context/execution.context.ts';
import { DatabaseMock } from '../../../src/mocks/database.ts';
import { LoggerMock } from '../../../src/mocks/logger.ts';
import { OrganizationRepositoryMock } from '../../../src/mocks/organization.repository.ts';
import { UserRepositoryMock } from '../../../src/mocks/user.repository.ts';
import { PasswordHashMock } from '../../../src/mocks/password.hash.ts';

const policy = {
  user: {
    userStatusPolicy: {
      isEnabled: (status: string) => status === 'active',
    },
  },
};

test('Cria AppContext com os providers recebidos', () => {
  const database = new DatabaseMock();
  const logger = new LoggerMock();
  const appContext = new AppContext({
    executionContextInput: {
      databaseProvider: database,
      loggerProvider: logger,
      passwordHashProvider: new PasswordHashMock(),
    },
    repositories: {
      users: new UserRepositoryMock(),
      organizations: new OrganizationRepositoryMock(),
    },
    policy,
  });

  assert.ok(appContext.executionContext instanceof ExecutionContext);
  assert.strictEqual(appContext.executionContext.databaseProvider, database);
  assert.strictEqual(appContext.executionContext.loggerProvider, logger);
});

test('Não compartilha ExecutionContext entre instâncias', () => {
  const appContext1 = new AppContext({
    executionContextInput: {
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    },
    repositories: {
      users: new UserRepositoryMock(),
      organizations: new OrganizationRepositoryMock(),
    },
    policy,
  });
  const appContext2 = new AppContext({
    executionContextInput: {
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    },
    repositories: {
      users: new UserRepositoryMock(),
      organizations: new OrganizationRepositoryMock(),
    },
    policy,
  });

  assert.notStrictEqual(appContext1.executionContext, appContext2.executionContext);
});
