import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AUTH_TYPES,
  AuthUseCase,
} from '../../../../../src/core/entities/auth/application/auth.authorize.ts';
import type { AuthPort } from '../../../../../src/core/entities/auth/auth.port.ts';
import type { LoginAuth } from '../../../../../src/core/entities/auth/domain/auth.login.ts';
import type { OAuthAuth } from '../../../../../src/core/entities/auth/domain/auth.oauth.ts';
import type { Membership } from '../../../../../src/core/entities/membership/membership.ts';
import type { TokenPort } from '../../../../../src/core/ports/token.port.ts';

const loginAuth: LoginAuth = {
  email: 'marco@example.com',
  password: 'secret',
  organizationId: 'organization-1',
};

const membership: Membership<'active'> = {
  id: 'membership-1',
  createdAt: new Date('2026-07-20T00:00:00.000Z'),
  updatedAt: new Date('2026-07-20T00:00:00.000Z'),
  status: 'active',
  organizationId: 'organization-1',
  actorId: 'actor-1',
  role: 'owner',
  permissions: [],
};

const membershipRepository = {
  findByActorOrganizationId: async () => membership,
};

function tokenPort(tokenCalls: Array<{ payload: unknown; config: unknown }>): TokenPort<string> {
  return {
    payload: { actorId: 'actor-1', organizationId: 'organization-1' },
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
}

test('Expõe todos os tipos de autenticação suportados', () => {
  assert.deepEqual(AUTH_TYPES, [
    'LOGIN',
    'CREDENTIALS',
    'OAUTH',
    'API_KEY',
    'CUSTOM',
  ]);
});

test('Gera token depois que o service do tipo selecionado autentica', async () => {
  const authenticationCalls: LoginAuth[] = [];
  const tokenCalls: Array<{ payload: unknown; config: unknown }> = [];
  const service: AuthPort<LoginAuth> = {
    authenticate: async (auth) => {
      authenticationCalls.push(auth);
      return { actorId: 'actor-1', actorType: 'USER' };
    },
  };
  const useCase = new AuthUseCase<string, 'LOGIN'>({
    services: { LOGIN: service },
    type: 'LOGIN',
    tokenPort: tokenPort(tokenCalls),
    membershipRepository,
  });

  const token = await useCase.execute({
    authenticated: loginAuth,
    payload: { actorId: 'actor-1', organizationId: 'organization-1' },
    config: { expiresIn: '1h' },
  });

  assert.deepEqual(token, { token: 'generated-token', membership });
  assert.deepEqual(authenticationCalls, [loginAuth]);
  assert.deepEqual(tokenCalls, [{
    payload: {
      actorId: 'actor-1',
      actorType: 'USER',
      organizationId: 'organization-1',
    },
    config: { expiresIn: '1h' },
  }]);
});

test('Não gera token quando o service rejeita a autenticação', async () => {
  const tokenCalls: Array<{ payload: unknown; config: unknown }> = [];
  const useCase = new AuthUseCase<string, 'LOGIN'>({
    services: {
      LOGIN: { authenticate: async () => null },
    },
    type: 'LOGIN',
    tokenPort: tokenPort(tokenCalls),
    membershipRepository,
  });

  await assert.rejects(
    useCase.execute({
      authenticated: loginAuth,
      payload: { actorId: 'actor-1', organizationId: 'organization-1' },
      config: {},
    }),
    /Authentication failed/,
  );
  assert.deepEqual(tokenCalls, []);
});

test('Encaminha para OAuth somente o objeto próprio desse tipo', async () => {
  const calls: OAuthAuth[] = [];
  const oauthAuth: OAuthAuth = {
    provider: 'google',
    accessToken: 'oauth-access-token',
    organizationId: 'organization-1',
  };
  const useCase = new AuthUseCase<string, 'OAUTH'>({
    services: {
      OAUTH: {
        authenticate: async (auth) => {
          calls.push(auth);
          return { actorId: 'actor-1', actorType: 'USER' };
        },
      },
    },
    type: 'OAUTH',
    tokenPort: tokenPort([]),
    membershipRepository,
  });

  await useCase.execute({
    authenticated: oauthAuth,
    payload: { actorId: 'actor-1', organizationId: 'organization-1' },
    config: {},
  });

  assert.deepEqual(calls, [oauthAuth]);
});

test('Não gera token quando o actor não possui membership na organização', async () => {
  const tokenCalls: Array<{ payload: unknown; config: unknown }> = [];
  const useCase = new AuthUseCase<string, 'LOGIN'>({
    services: {
      LOGIN: {
        authenticate: async () => ({ actorId: 'actor-1', actorType: 'USER' }),
      },
    },
    type: 'LOGIN',
    tokenPort: tokenPort(tokenCalls),
    membershipRepository: {
      findByActorOrganizationId: async () => null,
    },
  });

  await assert.rejects(
    useCase.execute({
      authenticated: loginAuth,
      payload: { actorId: 'actor-1', organizationId: 'organization-1' },
      config: {},
    }),
    /Actor is not authorized/,
  );
  assert.deepEqual(tokenCalls, []);
});

test('Falha quando o service do AuthType não foi configurado', async () => {
  const useCase = new AuthUseCase<string, 'OAUTH'>({
    services: {},
    type: 'OAUTH',
    tokenPort: tokenPort([]),
    membershipRepository,
  });

  await assert.rejects(
    useCase.execute({
      authenticated: {
        provider: 'google',
        accessToken: 'oauth-access-token',
        organizationId: 'organization-1',
      },
      payload: { actorId: 'actor-1', organizationId: 'organization-1' },
      config: {},
    }),
    /Invalid authentication type/,
  );
});
