import assert from 'node:assert/strict';
import test from 'node:test';
import { VerificationRepositoryMock } from '../../src/mocks/verification.repository.ts';

function pending(id: string, expiresAt = new Date('2026-07-22T12:15:00.000Z')) {
  return {
    id, purpose: 'EMAIL_CONFIRMATION' as const, channel: 'EMAIL' as const,
    actorId: 'actor-1', organizationId: null, destination: 'actor@example.com',
    credentialHash: 'hash', status: 'PENDING' as const, attempts: 0, maxAttempts: 2,
    createdAt: new Date('2026-07-22T12:00:00.000Z'), expiresAt,
    acceptedAt: null, rejectedAt: null, expiredAt: null,
  };
}

test('Aplica transições apenas enquanto o registro está pendente', async () => {
  const repository = new VerificationRepositoryMock();
  await repository.save(pending('verification-1'));
  assert.deepEqual(
    await repository.registerFailedAttempt('verification-1', new Date()),
    { attempts: 1, rejected: false },
  );
  assert.equal(await repository.acceptIfPending('verification-1', new Date()), true);
  assert.equal(await repository.expireIfPending('verification-1', new Date()), false);
});

test('Expira por prazo e por substituição de alvo', async () => {
  const repository = new VerificationRepositoryMock();
  await repository.save(pending('verification-1', new Date('2026-07-22T11:00:00.000Z')));
  await repository.save(pending('verification-2'));
  assert.equal(await repository.expirePending(new Date('2026-07-22T12:00:00.000Z')), 1);
  assert.equal(await repository.expirePendingFor({
    purpose: 'EMAIL_CONFIRMATION', actorId: 'actor-1', organizationId: null,
  }, new Date('2026-07-22T12:00:00.000Z')), 1);
  assert.deepEqual(repository.verifications.map(item => item.status), ['EXPIRED', 'EXPIRED']);
});
