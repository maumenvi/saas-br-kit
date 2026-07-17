import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { AuthUseCase } from '../../../../../src/core/entities/auth/application/auth.authorize.ts';
import type { AuthPort } from '../../../../../src/core/entities/auth/auth.port.ts';
import type { PasswordHashPort } from '../../../../../src/core/ports/password.hash.port.ts';
import type { TokenPort } from '../../../../../src/core/ports/token.port.ts';

const authenticated = {
  email: 'marco@example.com',
  password: 'secret',
  organizationId: 'organization-1',
};

function setup(isAuthenticated: boolean) {
  const authenticationCalls: unknown[] = [];
  const tokenCalls: Array<{ payload: unknown; config: unknown }> = [];
  const executionContext = {} as ExecutionContext;
  const userRepositoryPort = {
    findByEmail: async () => null,
  };
  const passwordHashPort: Pick<PasswordHashPort, 'verify'> = {
    verify: async () => isAuthenticated,
  };
  const auth: AuthPort = {
    authenticate: async (...args) => {
      authenticationCalls.push(args);
      return isAuthenticated;
    },
  };
  const tokenPort: TokenPort<string> = {
    payload: undefined,
    config: undefined,
    refreshPayload: undefined,
    refreshConfig: undefined,
    createToken: (payload, config) => {
      tokenCalls.push({ payload, config });
      return 'generated-token';
    },
    generateToken: async () => 'generated-token',
    verifyToken: async () => ({}),
    generateRefreshToken: async () => 'generated-refresh-token',
    verifyRefreshToken: async () => ({}),
  };
  const useCase = new AuthUseCase<string>({
    executionContext,
    auth,
    userRepositoryPort,
    passwordHashPort,
    tokenPort,
  });

  return {
    authenticationCalls,
    executionContext,
    passwordHashPort,
    tokenCalls,
    useCase,
    userRepositoryPort,
  };
}

test('Gera token depois de autenticar as credenciais', async () => {
  const {
    authenticationCalls,
    executionContext,
    passwordHashPort,
    tokenCalls,
    useCase,
    userRepositoryPort,
  } = setup(true);

  const token = await useCase.execute({
    authenticated,
    payload: { sub: 'user-1' },
    config: { expiresIn: '1h' },
  });

  assert.equal(token, 'generated-token');
  assert.deepEqual(authenticationCalls, [[
    authenticated,
    executionContext,
    userRepositoryPort,
    passwordHashPort,
  ]]);
  assert.deepEqual(tokenCalls, [
    {
      payload: { sub: 'user-1' },
      config: { expiresIn: '1h' },
    },
  ]);
});

test('Não gera token quando as credenciais são inválidas', async () => {
  const { tokenCalls, useCase } = setup(false);

  await assert.rejects(
    useCase.execute({
      authenticated,
      payload: { sub: 'user-1' },
      config: { expiresIn: '1h' },
    }),
    /Authentication failed/,
  );

  assert.deepEqual(tokenCalls, []);
});
