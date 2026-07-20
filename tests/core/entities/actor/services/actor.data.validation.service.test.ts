import assert from 'node:assert/strict';
import test from 'node:test';
import { Email } from '../../../../../src/core/entities/actor/domain/email.ts';
import { Telephone } from '../../../../../src/core/entities/actor/domain/telephone.ts';
import type { ActorStatusPolicyPort } from '../../../../../src/core/entities/actor/policies/actor.status.police.ts';
import { ActorDataValidationService } from '../../../../../src/core/entities/actor/services/actor.data.validation.service.ts';
import type { Actor } from '../../../../../src/core/entities/actor/actor.ts';
import type { ActorRepositoryPort } from '../../../../../src/core/entities/actor/actor.repositories.ts';

type Status = 'active' | 'inactive';

const statusPolicy: ActorStatusPolicyPort<Status> = {
  isEnabled: (status) => status === 'active',
};

function actor(status: Status, emailVerified: boolean): Actor<Status> {
  return {
    id: 'user-1',
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    updatedAt: new Date('2026-07-16T00:00:00.000Z'),
    status,
    type: 'USER',
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
    passwordHash: 'hashed-password',
    emailVerified,
  };
}

function repositoryWith(result: Actor<Status> | null): Pick<ActorRepositoryPort<Status>, 'findById'> {
  return {
    findById: async () => result,
  };
}

test('Retorna dados normalizados do actor USER habilitado', async () => {
  const service = new ActorDataValidationService(
    repositoryWith(actor('active', true)),
    statusPolicy,
  );

  assert.deepEqual(await service.findById('user-1'), {
    id: 'user-1',
    type: 'USER',
    enabled: true,
    emailVerified: true,
  });
});

test('Normaliza actor desabilitado sem expor o status', async () => {
  const service = new ActorDataValidationService(
    repositoryWith(actor('inactive', false)),
    statusPolicy,
  );

  assert.deepEqual(await service.findById('user-1'), {
    id: 'user-1',
    type: 'USER',
    enabled: false,
    emailVerified: false,
  });
});

test('Retorna nulo quando o actor não existe', async () => {
  const service = new ActorDataValidationService(
    repositoryWith(null),
    statusPolicy,
  );

  assert.equal(await service.findById('missing-actor'), null);
});
