import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthAuthenticatedService } from '../../../../../src/core/entities/auth/services/auth.authenticated.service.ts';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import type { UserRepositoryPort } from '../../../../../src/core/entities/user/user.repositories.ts';
import type { PasswordHashPort } from '../../../../../src/core/ports/password.hash.port.ts';

const auth = {
  email: 'marco@example.com',
  password: 'secret',
  organizationId: 'organization-1',
};

const executionContext = {
  databaseProvider: {
    run: async <Output>(operation: () => Promise<Output>) => operation(),
  },
} as ExecutionContext;

test('Retorna true quando o hash da senha confere', async () => {
  const service = new AuthAuthenticatedService();
  const userRepository = {
    findByEmail: async () => ({ passwordHash: 'stored-hash' }),
  } as unknown as UserRepositoryPort<unknown>;
  const passwordHash = {
    verify: async (password: string, hash: string) =>
      password === 'secret' && hash === 'stored-hash',
  } as PasswordHashPort;

  const result = await service.authenticate(
    auth,
    executionContext,
    userRepository,
    passwordHash,
  );

  assert.equal(result, true);
});

test('Retorna false quando o usuário não existe', async () => {
  const service = new AuthAuthenticatedService();
  const userRepository = {
    findByEmail: async () => null,
  } as unknown as UserRepositoryPort<unknown>;
  let verifyCalls = 0;
  const passwordHash = {
    verify: async () => {
      verifyCalls += 1;
      return true;
    },
  } as PasswordHashPort;

  const result = await service.authenticate(
    auth,
    executionContext,
    userRepository,
    passwordHash,
  );

  assert.equal(result, false);
  assert.equal(verifyCalls, 0);
});

test('Retorna false quando a senha não confere', async () => {
  const service = new AuthAuthenticatedService();
  const userRepository = {
    findByEmail: async () => ({ passwordHash: 'stored-hash' }),
  } as unknown as UserRepositoryPort<unknown>;
  const passwordHash = {
    verify: async () => false,
  } as PasswordHashPort;

  const result = await service.authenticate(
    auth,
    executionContext,
    userRepository,
    passwordHash,
  );

  assert.equal(result, false);
});
