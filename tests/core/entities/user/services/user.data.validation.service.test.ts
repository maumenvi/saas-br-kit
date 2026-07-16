import assert from 'node:assert/strict';
import test from 'node:test';
import { Email } from '../../../../../src/core/entities/user/domain/email.ts';
import { Telephone } from '../../../../../src/core/entities/user/domain/telephone.ts';
import type { UserStatusPolicyPort } from '../../../../../src/core/entities/user/policies/user.status.police.ts';
import { UserDataValidationService } from '../../../../../src/core/entities/user/services/user.data.validation.service.ts';
import type { User } from '../../../../../src/core/entities/user/user.ts';
import type { UserRepositoryPort } from '../../../../../src/core/entities/user/user.repositories.ts';

type Status = 'active' | 'inactive';

const statusPolicy: UserStatusPolicyPort<Status> = {
  isEnabled: (status) => status === 'active',
};

function user(status: Status, emailVerified: boolean): User<Status> {
  return {
    id: 'user-1',
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    updatedAt: new Date('2026-07-16T00:00:00.000Z'),
    status,
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
    passwordHash: 'hashed-password',
    emailVerified,
  };
}

function repositoryWith(result: User<Status> | null): Pick<UserRepositoryPort<Status>, 'findById'> {
  return {
    findById: async () => result,
  };
}

test('Retorna dados normalizados do usuário habilitado', async () => {
  const service = new UserDataValidationService(
    repositoryWith(user('active', true)),
    statusPolicy,
  );

  assert.deepEqual(await service.findById('user-1'), {
    id: 'user-1',
    enabled: true,
    emailVerified: true,
  });
});

test('Normaliza usuário desabilitado sem expor o status', async () => {
  const service = new UserDataValidationService(
    repositoryWith(user('inactive', false)),
    statusPolicy,
  );

  assert.deepEqual(await service.findById('user-1'), {
    id: 'user-1',
    enabled: false,
    emailVerified: false,
  });
});

test('Retorna nulo quando o usuário não existe', async () => {
  const service = new UserDataValidationService(
    repositoryWith(null),
    statusPolicy,
  );

  assert.equal(await service.findById('missing-user'), null);
});
