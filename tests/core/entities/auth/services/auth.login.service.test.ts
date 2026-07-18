import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import type { LoginAuth } from '../../../../../src/core/entities/auth/domain/auth.login.ts';
import { AuthLoginService } from '../../../../../src/core/entities/auth/services/auth.login.service.ts';
import type { UserRepositoryPort } from '../../../../../src/core/entities/user/user.repositories.ts';
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
  findByEmail: () => Promise<{ passwordHash: string } | null>,
  verify: (password: string, hash: string) => Promise<boolean>,
) {
  return new AuthLoginService(
    executionContext,
    { findByEmail } as Pick<UserRepositoryPort<unknown, unknown>, 'findByEmail'>,
    { verify } as Pick<PasswordHashPort, 'verify'>,
  );
}

test('Retorna true quando o hash da senha confere', async () => {
  const authService = service(
    async () => ({ passwordHash: 'stored-hash' }),
    async (password, hash) => password === 'secret' && hash === 'stored-hash',
  );

  assert.equal(await authService.authenticate(auth), true);
});

test('Retorna false quando o usuário não existe', async () => {
  let verifyCalls = 0;
  const authService = service(
    async () => null,
    async () => {
      verifyCalls += 1;
      return true;
    },
  );

  assert.equal(await authService.authenticate(auth), false);
  assert.equal(verifyCalls, 0);
});

test('Retorna false quando a senha não confere', async () => {
  const authService = service(
    async () => ({ passwordHash: 'stored-hash' }),
    async () => false,
  );

  assert.equal(await authService.authenticate(auth), false);
});
