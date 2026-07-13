import test from 'node:test';
import assert from 'node:assert/strict';
import { AppContext, ExecutionContext } from '../../../src/core/index.ts';
import { DatabaseMock, LoggerMock, UserRepositoryMock } from '../../../src/mocks/index.ts';

test('Cria AppContext com os providers recebidos', () => {
  const database = new DatabaseMock();
  const logger = new LoggerMock();
  const appContext = new AppContext({
    executionContextInput: {
      databaseProvider: database,
      loggerProvider: logger,
    },
    repositories: { users: new UserRepositoryMock() },
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
    repositories: { users: new UserRepositoryMock() },
  });
  const appContext2 = new AppContext({
    executionContextInput: {
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
    },
    repositories: { users: new UserRepositoryMock() },
  });

  assert.notStrictEqual(appContext1.executionContext, appContext2.executionContext);
});
