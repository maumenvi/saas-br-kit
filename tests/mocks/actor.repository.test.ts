import test from 'node:test';
import assert from 'node:assert/strict';
import { Email } from '../../src/core/entities/actor/domain/email.ts';
import { Telephone } from '../../src/core/entities/actor/domain/telephone.ts';
import type { Status } from '../../src/mocks/status.ts';
import { ActorRepositoryMock } from '../../src/mocks/actor.repository.ts';

test('Armazena actors salvos', async () => {
  const repository = new ActorRepositoryMock();
  const actor = {
    id: 'actor-1',
    createdAt: new Date('2026-07-13T00:00:00.000Z'),
    updatedAt: new Date('2026-07-13T00:00:00.000Z'),
    status: 'active' as Status,
    type: 'USER' as const,
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
    passwordHash: 'hashed-password',
    emailVerified: true,
  };

  await repository.save(actor);

  assert.deepEqual(repository.actors, [actor]);
});
