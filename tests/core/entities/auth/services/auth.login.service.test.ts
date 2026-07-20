import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import type { LoginAuth } from '../../../../../src/core/entities/auth/domain/auth.login.ts';
import { AuthLoginService } from '../../../../../src/core/entities/auth/services/auth.login.service.ts';
import type { ActorRepositoryPort } from '../../../../../src/core/entities/actor/actor.repositories.ts';
import type { PasswordHashPort } from '../../../../../src/core/ports/password.hash.port.ts';

const auth: LoginAuth = {
  email: 'marco@example.com',
  password: 'secret',
  organizationId: 'organization-1',
};

const executionContext = {
  databaseProvider: {
    run: async <Output>(operation: () => Promise<Output>) => operation(),
  },
} as ExecutionContext;

function service(
  findByEmail: () => Promise<{ id: string; type: 'USER'; passwordHash: string } | null>,
  verify: (password: string, hash: string) => Promise<boolean>,
) {
  return new AuthLoginService(
    executionContext,
    { findByEmail } as Pick<ActorRepositoryPort<unknown, unknown>, 'findByEmail'>,
    { verify } as Pick<PasswordHashPort, 'verify'>,
  );
}

test('Retorna o actor quando o hash da senha confere', async () => {
  const authService = service(
    async () => ({ id: 'actor-1', type: 'USER', passwordHash: 'stored-hash' }),
    async (password, hash) => password === 'secret' && hash === 'stored-hash',
  );

  assert.deepEqual(await authService.authenticate(auth), {
    actorId: 'actor-1',
    actorType: 'USER',
  });
});

test('Retorna nulo quando o actor não existe', async () => {
  let verifyCalls = 0;
  const authService = service(
    async () => null,
    async () => {
      verifyCalls += 1;
      return true;
    },
  );

  assert.equal(await authService.authenticate(auth), null);
  assert.equal(verifyCalls, 0);
});

test('Retorna nulo quando a senha não confere', async () => {
  const authService = service(
    async () => ({ id: 'actor-1', type: 'USER', passwordHash: 'stored-hash' }),
    async () => false,
  );

  assert.equal(await authService.authenticate(auth), null);
});
