import assert from 'node:assert/strict';
import test from 'node:test';
import { IdempotencyMock } from '../../src/mocks/idempotency.ts';

const execution = {
  action: 'actor:create',
  fingerprint: 'body-hash',
  input: 2,
  key: 'idempotency-key',
};

test('Conclui uma lease e reproduz seu output', async () => {
  const provider = new IdempotencyMock();
  const acquired = await provider.acquire<number, number>(execution);

  assert.equal(acquired.status, 'ACQUIRED');
  if (acquired.status !== 'ACQUIRED') return;

  await provider.complete({
    fingerprint: execution.fingerprint,
    key: execution.key,
    leaseId: acquired.leaseId,
    output: 4,
  });

  const replay = await provider.acquire<number, number>(execution);
  assert.deepEqual(replay, { status: 'REPLAY', output: 4 });
  assert.deepEqual(provider.actions, ['actor:create', 'actor:create']);
  assert.equal(provider.completions[0]?.leaseId, acquired.leaseId);
});

test('Informa quando a mesma chave ainda está em processamento', async () => {
  const provider = new IdempotencyMock();

  const acquired = await provider.acquire<number, number>(execution);
  const concurrent = await provider.acquire<number, number>(execution);

  assert.equal(acquired.status, 'ACQUIRED');
  assert.deepEqual(concurrent, { status: 'IN_PROGRESS' });
});

test('Somente a lease atual consegue liberar a chave', async () => {
  const provider = new IdempotencyMock();
  const acquired = await provider.acquire<number, number>(execution);
  assert.equal(acquired.status, 'ACQUIRED');
  if (acquired.status !== 'ACQUIRED') return;

  await provider.release({
    fingerprint: execution.fingerprint,
    key: execution.key,
    leaseId: 'stale-lease',
  });
  assert.deepEqual(
    await provider.acquire<number, number>(execution),
    { status: 'IN_PROGRESS' },
  );

  await provider.release({
    fingerprint: execution.fingerprint,
    key: execution.key,
    leaseId: acquired.leaseId,
  });
  const reacquired = await provider.acquire<number, number>(execution);

  assert.equal(reacquired.status, 'ACQUIRED');
  if (reacquired.status === 'ACQUIRED') {
    assert.notEqual(reacquired.leaseId, acquired.leaseId);
  }
});
