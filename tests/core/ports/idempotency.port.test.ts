import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  IdempotencyCompletion,
  IdempotencyPort,
  IdempotencyRelease,
} from '../../../src/core/ports/idempotency.port.ts';

test('Define aquisição, conclusão e liberação genéricas', async () => {
  const completions: IdempotencyCompletion<unknown>[] = [];
  const releases: IdempotencyRelease[] = [];
  const provider: IdempotencyPort = {
    async acquire() {
      return { status: 'ACQUIRED', leaseId: 'lease-1' };
    },
    async complete(completion) {
      completions.push(completion);
    },
    async release(release) {
      releases.push(release);
    },
  };
  const execution = {
    action: 'number:double',
    fingerprint: 'number-fingerprint',
    input: 2,
    key: 'number-key',
  };

  const acquisition = await provider.acquire<number, number>(execution);
  assert.deepEqual(acquisition, { status: 'ACQUIRED', leaseId: 'lease-1' });

  await provider.complete({
    fingerprint: execution.fingerprint,
    key: execution.key,
    leaseId: 'lease-1',
    output: 4,
  });
  await provider.release({
    fingerprint: execution.fingerprint,
    key: execution.key,
    leaseId: 'lease-1',
  });

  assert.equal(completions[0]?.output, 4);
  assert.equal(releases[0]?.leaseId, 'lease-1');
});
