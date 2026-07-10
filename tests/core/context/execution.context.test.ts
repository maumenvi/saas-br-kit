import test from 'node:test';
import assert from 'node:assert/strict';
import { ExecutionContext } from '../../../src/core/index.ts';
import { DatabaseMock, LoggerMock } from '../../../src/mocks/index.ts';

test('Mantém os providers recebidos', () => {
  const databaseMock = new DatabaseMock();
  const loggerMock = new LoggerMock();
  const executionContext = new ExecutionContext({
    databaseProvider: databaseMock,
    loggerProvider: loggerMock,
  });
  assert.strictEqual(executionContext.databaseProvider, databaseMock);
  assert.strictEqual(executionContext.loggerProvider, loggerMock);
});

test('Disponibiliza database provider', async () => {
  const databaseMock = new DatabaseMock();
  const executionContext = new ExecutionContext({
    databaseProvider: databaseMock,
    loggerProvider: new LoggerMock(),
  });

  const result = await executionContext.databaseProvider.run(
    async (transaction) => {
      assert.strictEqual(transaction, databaseMock.transaction);
      return 'success';
    }
  );
  assert.equal(result, 'success');
  assert.equal(databaseMock.started, 1);
  assert.equal(databaseMock.commited, 1);
  assert.equal(databaseMock.rolledback, 0);
});

test('Não compartilha providers entre instâncias', () => {
  const executionContext1 = new ExecutionContext({
    databaseProvider: new DatabaseMock(),
    loggerProvider: new LoggerMock(),
  });
  const executionContext2 = new ExecutionContext({
    databaseProvider: new DatabaseMock(),
    loggerProvider: new LoggerMock(),
  });

  assert.notStrictEqual(executionContext1.databaseProvider, executionContext2.databaseProvider);
  assert.notStrictEqual(executionContext1.loggerProvider, executionContext2.loggerProvider);
});
