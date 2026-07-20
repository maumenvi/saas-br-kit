import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthComposition } from '../../../src/composition/modules/auth.composition.ts';
import { ExecutionContext } from '../../../src/core/context/execution.context.ts';
import { Email } from '../../../src/core/entities/actor/domain/email.ts';
import { Telephone } from '../../../src/core/entities/actor/domain/telephone.ts';
import type { UserActor } from '../../../src/core/entities/actor/actor.ts';
import type { Membership } from '../../../src/core/entities/membership/membership.ts';
import type { LoggerPort } from '../../../src/core/ports/logger.port.ts';
import type { TokenPort } from '../../../src/core/ports/token.port.ts';
import { DatabaseMock } from '../../../src/mocks/database.ts';
import { LoggerMock } from '../../../src/mocks/logger.ts';
import { MembershipRepositoryMock } from '../../../src/mocks/membership.repository.ts';
import { PasswordHashMock } from '../../../src/mocks/password.hash.ts';
import type { Status } from '../../../src/mocks/status.ts';
import { ActorRepositoryMock } from '../../../src/mocks/actor.repository.ts';

function actorFixture(): UserActor<Status> {
  return {
    id: 'actor-1',
    createdAt: new Date('2026-07-17T00:00:00.000Z'),
    updatedAt: new Date('2026-07-17T00:00:00.000Z'),
    status: 'active',
    type: 'USER',
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
    passwordHash: 'hashed-secret',
    emailVerified: true,
  };
}

function membershipFixture(actorId = 'actor-1'): Membership<Status> {
  return {
    id: 'membership-1',
    createdAt: new Date('2026-07-20T00:00:00.000Z'),
    updatedAt: new Date('2026-07-20T00:00:00.000Z'),
    status: 'active',
    organizationId: 'organization-1',
    actorId,
    role: 'owner',
    permissions: [],
  };
}

function authorizedMembershipRepository(actorId = 'actor-1') {
  const repository = new MembershipRepositoryMock();
  repository.memberships.push(membershipFixture(actorId));
  return repository;
}

function setup(
  actorRepository = new ActorRepositoryMock(),
  loggerProvider: LoggerPort = new LoggerMock(),
) {
  const generatedTokens: Array<{ payload: unknown; config: unknown }> = [];
  const tokenPort: TokenPort<string> = {
    payload: { actorId: 'actor-1', organizationId: 'organization-1' },
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
    actorRepositoryPort: actorRepository,
    membershipRepository: authorizedMembershipRepository(),
    authentication: {
      type: 'LOGIN',
      tokenPort,
    },
  });

  return { actorRepository, composition, generatedTokens };
}

test('Expõe o handler de autenticação', () => {
  const { composition } = setup();

  assert.equal(typeof composition.authenticate, 'function');
});

test('Autentica e gera o token quando as credenciais correspondem ao usuário', async () => {
  const { actorRepository, composition, generatedTokens } = setup();
  await actorRepository.save(actorFixture());

  const token = await composition.authenticate({
    authenticated: {
      email: 'marco@example.com',
      password: 'secret',
      organizationId: 'organization-1',
    },
    payload: { actorId: 'actor-1', organizationId: 'organization-1' },
    config: { expiresIn: '1h' },
  });

  assert.deepEqual(token, {
    token: 'generated-token',
    membership: membershipFixture(),
  });
  assert.deepEqual(generatedTokens, [
    {
      payload: {
        actorId: 'actor-1',
        actorType: 'USER',
        organizationId: 'organization-1',
      },
      config: { expiresIn: '1h' },
    },
  ]);
});

test('Não gera token para credenciais inválidas', async () => {
  const { actorRepository, composition, generatedTokens } = setup();
  await actorRepository.save(actorFixture());

  await assert.rejects(
    composition.authenticate({
      authenticated: {
        email: 'marco@example.com',
        password: 'invalid',
        organizationId: 'organization-1',
      },
      payload: { actorId: 'actor-1', organizationId: 'organization-1' },
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
  const actorRepository = new ActorRepositoryMock();
  actorRepository.findByEmail = async () => {
    throw error;
  };
  const { composition } = setup(actorRepository, logger);

  await assert.rejects(
    composition.authenticate({
      authenticated: {
        email: 'marco@example.com',
        password: 'secret',
        organizationId: 'organization-1',
      },
      payload: { actorId: 'actor-1', organizationId: 'organization-1' },
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
    payload: { actorId: 'actor-1', organizationId: 'organization-1' },
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
    actorRepositoryPort: new ActorRepositoryMock(),
    membershipRepository: authorizedMembershipRepository(),
    authentication: {
      type: 'CUSTOM',
      tokenPort,
      service: {
        authenticate: async (auth) => {
          customCalls += 1;
          return auth.signedChallenge === 'signed-value'
            ? { actorId: 'actor-1', actorType: 'CLIENT' }
            : null;
        },
      },
    },
  });

  const token = await composition.authenticate({
    authenticated: {
      signedChallenge: 'signed-value',
      tenant: 'organization-1',
    },
    payload: {
      actorId: 'ignored-by-auth-use-case',
      organizationId: 'organization-1',
      custom: true,
    },
    config: {},
  });

  assert.deepEqual(token, {
    token: 'custom-token',
    membership: membershipFixture(),
  });
  assert.equal(customCalls, 1);
  assert.deepEqual(generatedTokens, [{
    actorId: 'actor-1',
    actorType: 'CLIENT',
    organizationId: 'organization-1',
    custom: true,
  }]);
});

test('Monta CREDENTIALS com o AuthPort injetado em service', async () => {
  const calls: Array<{
    identifier: string;
    secret: string;
    organizationId: string;
  }> = [];
  const tokenPort: TokenPort<string> = {
    payload: { actorId: 'actor-1', organizationId: 'organization-1' },
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
    actorRepositoryPort: new ActorRepositoryMock(),
    membershipRepository: authorizedMembershipRepository(),
    authentication: {
      type: 'CREDENTIALS',
      tokenPort,
      service: {
        authenticate: async (auth) => {
          calls.push(auth);
          return auth.identifier === 'marco@example.com'
            ? { actorId: 'actor-1', actorType: 'CLIENT' }
            : null;
        },
      },
    },
  });

  assert.deepEqual(await composition.authenticate({
    authenticated: {
      identifier: 'marco@example.com',
      secret: 'secret',
      organizationId: 'organization-1',
    },
    payload: { actorId: 'actor-1', organizationId: 'organization-1' },
    config: {},
  }), {
    token: 'strategy-token',
    membership: membershipFixture(),
  });
  assert.deepEqual(calls, [{
    identifier: 'marco@example.com',
    secret: 'secret',
    organizationId: 'organization-1',
  }]);
});

test('Monta OAUTH e API_KEY com o AuthPort injetado em service', async () => {
  const calls = { OAUTH: 0, API_KEY: 0 };
  const tokenPort: TokenPort<string> = {
    payload: { actorId: 'actor-1', organizationId: 'organization-1' },
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
    actorRepositoryPort: new ActorRepositoryMock(),
    membershipRepository: authorizedMembershipRepository(),
    authentication: {
      type: 'OAUTH',
      tokenPort,
      service: {
        authenticate: async (auth) => {
          calls.OAUTH += 1;
          return auth.provider === 'google'
            ? { actorId: 'actor-1', actorType: 'USER' }
            : null;
        },
      },
    },
  });
  const apiKey = new AuthComposition<string, 'API_KEY'>({
    executionContext: context(),
    actorRepositoryPort: new ActorRepositoryMock(),
    membershipRepository: authorizedMembershipRepository(),
    authentication: {
      type: 'API_KEY',
      tokenPort,
      service: {
        authenticate: async (auth) => {
          calls.API_KEY += 1;
          return auth.apiKey === 'api-key-value'
            ? { actorId: 'actor-1', actorType: 'SERVICE' }
            : null;
        },
      },
    },
  });

  assert.deepEqual(await oauth.authenticate({
    authenticated: {
      provider: 'google',
      accessToken: 'oauth-access-token',
      organizationId: 'organization-1',
    },
    payload: { actorId: 'actor-1', organizationId: 'organization-1' },
    config: {},
  }), {
    token: 'strategy-token',
    membership: membershipFixture(),
  });
  assert.deepEqual(await apiKey.authenticate({
    authenticated: {
      apiKey: 'api-key-value',
      organizationId: 'organization-1',
    },
    payload: { actorId: 'actor-1', organizationId: 'organization-1' },
    config: {},
  }), {
    token: 'strategy-token',
    membership: membershipFixture(),
  });

  assert.deepEqual(calls, {
    OAUTH: 1,
    API_KEY: 1,
  });
});
