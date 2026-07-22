import test from 'node:test';
import assert from 'node:assert/strict';
import { ExecutionContext } from '../../../src/core/context/execution.context.ts';
import { DatabaseMock } from '../../../src/mocks/database.ts';
import { LoggerMock } from '../../../src/mocks/logger.ts';
import { IdempotencyMock } from '../../../src/mocks/idempotency.ts';
import { PasswordHashMock } from '../../../src/mocks/password.hash.ts';

test('Mantém os providers recebidos', () => {
  const databaseMock = new DatabaseMock();
  const loggerMock = new LoggerMock();
  const idempotencyMock = new IdempotencyMock();
  const executionContext = new ExecutionContext({
    databaseProvider: databaseMock,
    loggerProvider: loggerMock,
    passwordHashProvider: new PasswordHashMock(),
    idempotencyProvider: idempotencyMock,
  });
  assert.strictEqual(executionContext.databaseProvider, databaseMock);
  assert.strictEqual(executionContext.loggerProvider, loggerMock);
  assert.strictEqual(executionContext.idempotencyProvider, idempotencyMock);
});

test('Mantém o provider de idempotência opcional', () => {
  const executionContext = new ExecutionContext({
    databaseProvider: new DatabaseMock(),
    loggerProvider: new LoggerMock(),
    passwordHashProvider: new PasswordHashMock(),
  });

  assert.equal(executionContext.idempotencyProvider, undefined);
});

test('Disponibiliza database provider', async () => {
  const databaseMock = new DatabaseMock();
  const executionContext = new ExecutionContext({
    databaseProvider: databaseMock,
    loggerProvider: new LoggerMock(),
    passwordHashProvider: new PasswordHashMock()
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
    passwordHashProvider: new PasswordHashMock()
  });
  const executionContext2 = new ExecutionContext({
    databaseProvider: new DatabaseMock(),
    loggerProvider: new LoggerMock(),
    passwordHashProvider: new PasswordHashMock()
  });

  assert.notStrictEqual(executionContext1.databaseProvider, executionContext2.databaseProvider);
  assert.notStrictEqual(executionContext1.loggerProvider, executionContext2.loggerProvider);
});
