import assert from 'node:assert/strict';
import test from 'node:test';
import type { Mfa } from '../../src/core/entities/mfa/mfa.ts';
import { MfaRepositoryMock } from '../../src/mocks/mfa.repository.ts';

function pendingMfa(): Mfa {
  return {
    id: 'mfa-1',
    actorId: 'actor-1',
    method: 'TOTP',
    status: 'PENDING',
    providerCredential: 'protected-secret',
    lastUsedCounter: null,
    createdAt: new Date('2026-07-22T00:00:00.000Z'),
    updatedAt: new Date('2026-07-22T00:00:00.000Z'),
    activatedAt: null,
  };
}

test('Ativa MFA e consome somente contadores crescentes', async () => {
  const repository = new MfaRepositoryMock();
  await repository.save(pendingMfa());
  const now = new Date('2026-07-22T01:00:00.000Z');

  assert.equal(await repository.activate('mfa-1', 1, now), true);
  assert.equal(await repository.consumeCounter('mfa-1', 1, now), false);
  assert.equal(await repository.consumeCounter('mfa-1', 2, now), true);
  assert.equal((await repository.findActiveByActorId('actor-1'))?.lastUsedCounter, 2);
});
