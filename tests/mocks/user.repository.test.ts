import test from 'node:test';
import assert from 'node:assert/strict';
import { Email, Telephone } from '../../src/core/index.ts';
import { UserRepositoryMock } from '../../src/mocks/user.repository.ts';

test('Armazena usuários salvos', async () => {
  const repository = new UserRepositoryMock();
  const user = {
    id: 'user-1',
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
  };

  await repository.save(user);

  assert.deepEqual(repository.users, [user]);
});
