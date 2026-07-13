import test from 'node:test';
import assert from 'node:assert/strict';
import { Email, Telephone } from '../../src/core/index.ts';
import { UserRepositoryMock } from '../../src/mocks/user.repository.ts';

test('Armazena usuários salvos', async () => {
  const repository = new UserRepositoryMock();
  const user = {
    id: 'user-1',
    createdAt: new Date('2026-07-13T00:00:00.000Z'),
    updatedAt: new Date('2026-07-13T00:00:00.000Z'),
    active: true,
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
  };

  await repository.save(user);

  assert.deepEqual(repository.users, [user]);
});
