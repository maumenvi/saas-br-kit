import test from 'node:test';
import assert from 'node:assert/strict';
import { AppContext } from '../../../src/core/context/app.context.ts';
import { ExecutionContext } from '../../../src/core/context/execution.context.ts';
import { DatabaseMock } from '../../../src/mocks/database.ts';
import { LoggerMock } from '../../../src/mocks/logger.ts';
import { OrganizationRepositoryMock } from '../../../src/mocks/organization.repository.ts';
import { UserRepositoryMock } from '../../../src/mocks/user.repository.ts';

test('Cria AppContext com os providers recebidos', () => {
  const database = new DatabaseMock();
  const logger = new LoggerMock();
  const appContext = new AppContext({
    executionContextInput: {
      databaseProvider: database,
      loggerProvider: logger,
    },
    repositories: {
      users: new UserRepositoryMock(),
      organizations: new OrganizationRepositoryMock(),
    },
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
    },
    repositories: {
      users: new UserRepositoryMock(),
      organizations: new OrganizationRepositoryMock(),
    },
  });
  const appContext2 = new AppContext({
    executionContextInput: {
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
    },
    repositories: {
      users: new UserRepositoryMock(),
      organizations: new OrganizationRepositoryMock(),
    },
  });

  assert.notStrictEqual(appContext1.executionContext, appContext2.executionContext);
});
