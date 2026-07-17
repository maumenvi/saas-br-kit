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
  const composition = new AuthComposition<string>({
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider,
      passwordHashProvider: new PasswordHashMock(),
    }),
    userRepositoryPort: userRepository,
    tokenPort,
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
