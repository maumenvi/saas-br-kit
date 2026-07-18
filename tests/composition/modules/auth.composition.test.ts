import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthComposition } from '../../../src/composition/modules/auth.composition.ts';
import { ExecutionContext } from '../../../src/core/context/execution.context.ts';
import { Email } from '../../../src/core/entities/user/domain/email.ts';
import { Telephone } from '../../../src/core/entities/user/domain/telephone.ts';
import type { User } from '../../../src/core/entities/user/user.ts';
import type { LoggerPort } from '../../../src/core/ports/logger.port.ts';
import type { TokenPort } from '../../../src/core/ports/token.port.ts';
import { DatabaseMock } from '../../../src/mocks/database.ts';
import { LoggerMock } from '../../../src/mocks/logger.ts';
import { PasswordHashMock } from '../../../src/mocks/password.hash.ts';
import type { Status } from '../../../src/mocks/status.ts';
import { UserRepositoryMock } from '../../../src/mocks/user.repository.ts';

function userFixture(): User<Status> {
  return {
    id: 'user-1',
    createdAt: new Date('2026-07-17T00:00:00.000Z'),
    updatedAt: new Date('2026-07-17T00:00:00.000Z'),
    status: 'active',
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
    passwordHash: 'hashed-secret',
    emailVerified: true,
  };
}

function setup(
  userRepository = new UserRepositoryMock(),
  loggerProvider: LoggerPort = new LoggerMock(),
) {
  const generatedTokens: Array<{ payload: unknown; config: unknown }> = [];
  const tokenPort: TokenPort<string> = {
    payload: undefined,
    config: undefined,
    refreshPayload: undefined,
    refreshConfig: undefined,
    createToken: (payload, config) => {
      generatedTokens.push({ payload, config });
      return 'generated-token';
    },
    generateToken: async () => 'generated-token',
    verifyToken: async () => ({}),
    generateRefreshToken: async () => 'generated-refresh-token',
    verifyRefreshToken: async () => ({}),
  };
  const composition = new AuthComposition<string, 'LOGIN'>({
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider,
      passwordHashProvider: new PasswordHashMock(),
    }),
    userRepositoryPort: userRepository,
    authentication: {
      type: 'LOGIN',
      tokenPort,
    },
  });

  return { composition, generatedTokens, userRepository };
}

test('Expõe o handler de autenticação', () => {
  const { composition } = setup();

  assert.equal(typeof composition.authenticate, 'function');
});

test('Autentica e gera o token quando as credenciais correspondem ao usuário', async () => {
  const { composition, generatedTokens, userRepository } = setup();
  await userRepository.save(userFixture());

  const token = await composition.authenticate({
    authenticated: {
      email: 'marco@example.com',
      password: 'secret',
      organizationId: 'organization-1',
    },
    payload: { sub: 'user-1' },
    config: { expiresIn: '1h' },
  });

  assert.equal(token, 'generated-token');
  assert.deepEqual(generatedTokens, [
    {
      payload: { sub: 'user-1' },
      config: { expiresIn: '1h' },
    },
  ]);
});

test('Não gera token para credenciais inválidas', async () => {
  const { composition, generatedTokens, userRepository } = setup();
  await userRepository.save(userFixture());

  await assert.rejects(
    composition.authenticate({
      authenticated: {
        email: 'marco@example.com',
        password: 'invalid',
        organizationId: 'organization-1',
      },
      payload: { sub: 'user-1' },
      config: { expiresIn: '1h' },
    }),
    /Authentication failed/,
  );

  assert.deepEqual(generatedTokens, []);
});

test('Registra e propaga falhas pelo interceptor padrão', async () => {
  const error = new Error('Falha ao consultar usuário');
  const errors: unknown[][] = [];
  const logger: LoggerPort = {
    error: (...args: unknown[]) => errors.push(args),
    warn: () => undefined,
    info: () => undefined,
    debug: () => undefined,
  };
  const userRepository = new UserRepositoryMock();
  userRepository.findByEmail = async () => {
    throw error;
  };
  const { composition } = setup(userRepository, logger);

  await assert.rejects(
    composition.authenticate({
      authenticated: {
        email: 'marco@example.com',
        password: 'secret',
        organizationId: 'organization-1',
      },
      payload: { sub: 'user-1' },
      config: { expiresIn: '1h' },
    }),
    error,
  );

  assert.deepEqual(errors, [
    ['Falha ao consultar usuário', error],
  ]);
});

test('Usa obrigatoriamente o service injetado para CUSTOM', async () => {
  type CustomAuth = {
    signedChallenge: string;
    tenant: string;
  };
  let customCalls = 0;
  const generatedTokens: unknown[] = [];
  const tokenPort: TokenPort<string> = {
    payload: undefined,
    config: undefined,
    refreshPayload: undefined,
    refreshConfig: undefined,
    createToken: (payload) => {
      generatedTokens.push(payload);
      return 'custom-token';
    },
    generateToken: async () => 'custom-token',
    verifyToken: async () => ({}),
    generateRefreshToken: async () => 'custom-refresh-token',
    verifyRefreshToken: async () => ({}),
  };
  const composition = new AuthComposition<string, 'CUSTOM', CustomAuth>({
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    userRepositoryPort: new UserRepositoryMock(),
    authentication: {
      type: 'CUSTOM',
      tokenPort,
      service: {
        authenticate: async (auth) => {
          customCalls += 1;
          return auth.signedChallenge === 'signed-value';
        },
      },
    },
  });

  const token = await composition.authenticate({
    authenticated: {
      signedChallenge: 'signed-value',
      tenant: 'organization-1',
    },
    payload: { custom: true },
    config: {},
  });

  assert.equal(token, 'custom-token');
  assert.equal(customCalls, 1);
  assert.deepEqual(generatedTokens, [{ custom: true }]);
});

test('Monta CREDENTIALS com o AuthPort injetado em service', async () => {
  const calls: Array<{
    identifier: string;
    secret: string;
    organizationId: string;
  }> = [];
  const tokenPort: TokenPort<string> = {
    payload: undefined,
    config: undefined,
    refreshPayload: undefined,
    refreshConfig: undefined,
    createToken: () => 'strategy-token',
    generateToken: async () => 'strategy-token',
    verifyToken: async () => ({}),
    generateRefreshToken: async () => 'strategy-refresh-token',
    verifyRefreshToken: async () => ({}),
  };
  const composition = new AuthComposition<string, 'CREDENTIALS'>({
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    userRepositoryPort: new UserRepositoryMock(),
    authentication: {
      type: 'CREDENTIALS',
      tokenPort,
      service: {
        authenticate: async (auth) => {
          calls.push(auth);
          return auth.identifier === 'marco@example.com';
        },
      },
    },
  });

  assert.equal(await composition.authenticate({
    authenticated: {
      identifier: 'marco@example.com',
      secret: 'secret',
      organizationId: 'organization-1',
    },
    payload: {},
    config: {},
  }), 'strategy-token');
  assert.deepEqual(calls, [{
    identifier: 'marco@example.com',
    secret: 'secret',
    organizationId: 'organization-1',
  }]);
});

test('Monta OAUTH e API_KEY com o AuthPort injetado em service', async () => {
  const calls = { OAUTH: 0, API_KEY: 0 };
  const tokenPort: TokenPort<string> = {
    payload: undefined,
    config: undefined,
    refreshPayload: undefined,
    refreshConfig: undefined,
    createToken: () => 'strategy-token',
    generateToken: async () => 'strategy-token',
    verifyToken: async () => ({}),
    generateRefreshToken: async () => 'strategy-refresh-token',
    verifyRefreshToken: async () => ({}),
  };
  const context = () => new ExecutionContext({
    databaseProvider: new DatabaseMock(),
    loggerProvider: new LoggerMock(),
    passwordHashProvider: new PasswordHashMock(),
  });
  const oauth = new AuthComposition<string, 'OAUTH'>({
    executionContext: context(),
    userRepositoryPort: new UserRepositoryMock(),
    authentication: {
      type: 'OAUTH',
      tokenPort,
      service: {
        authenticate: async (auth) => {
          calls.OAUTH += 1;
          return auth.provider === 'google';
        },
      },
    },
  });
  const apiKey = new AuthComposition<string, 'API_KEY'>({
    executionContext: context(),
    userRepositoryPort: new UserRepositoryMock(),
    authentication: {
      type: 'API_KEY',
      tokenPort,
      service: {
        authenticate: async (auth) => {
          calls.API_KEY += 1;
          return auth.apiKey === 'api-key-value';
        },
      },
    },
  });

  assert.equal(await oauth.authenticate({
    authenticated: {
      provider: 'google',
      accessToken: 'oauth-access-token',
      organizationId: 'organization-1',
    },
    payload: {},
    config: {},
  }), 'strategy-token');
  assert.equal(await apiKey.authenticate({
    authenticated: {
      apiKey: 'api-key-value',
      organizationId: 'organization-1',
    },
    payload: {},
    config: {},
  }), 'strategy-token');

  assert.deepEqual(calls, {
    OAUTH: 1,
    API_KEY: 1,
  });
});
