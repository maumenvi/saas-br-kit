import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseMock } from '../../src/mocks/database.ts';

test('Executa callback e confirma a transação', async () => {
  const database = new DatabaseMock();
  const result = await database.run(async (transaction) => {
    assert.strictEqual(transaction, database.transaction);
    return 'result';
  });

  assert.equal(result, 'result');
  assert.equal(database.started, 1);
  assert.equal(database.commited, 1);
  assert.equal(database.rolledback, 0);
});

test('Registra rollback e relança rejeição do callback', async () => {
  const database = new DatabaseMock();
  const failure = new Error('Transaction failed');

  await assert.rejects(
    database.run(async () => {
      throw failure;
    }),
    (error) => error === failure,
  );

  assert.equal(database.started, 1);
  assert.equal(database.commited, 0);
  assert.equal(database.rolledback, 1);
});

test('Acumula contadores entre execuções', async () => {
  const database = new DatabaseMock();

  await database.run(async () => undefined);
  await database.run(async () => undefined);

  assert.equal(database.started, 2);
  assert.equal(database.commited, 2);
});
