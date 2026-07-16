import test from 'node:test';
import assert from 'node:assert/strict';
import { UserComposition } from '../../../src/composition/modules/user.composition.ts';
import { ExecutionContext } from '../../../src/core/context/execution.context.ts';
import type { LoggerPort } from '../../../src/core/ports/logger.port.ts';
import { DomainError } from '../../../src/core/shared/domain/domain.error.ts';
import { Email } from '../../../src/core/entities/user/domain/email.ts';
import { Telephone } from '../../../src/core/entities/user/domain/telephone.ts';
import type { User } from '../../../src/core/entities/user/user.ts';
import { DatabaseMock } from '../../../src/mocks/database.ts';
import { LoggerMock } from '../../../src/mocks/logger.ts';
import type { Status } from '../../../src/mocks/status.ts';
import { UserRepositoryMock } from '../../../src/mocks/user.repository.ts';
import { PasswordHashMock } from '../../../src/mocks/password.hash.ts';

const userStatusPolicy = {
  isEnabled: (status: Status) => status === 'active',
};

type ErrorLog = {
  message: string;
  args: unknown[];
};

class RecordingLogger implements LoggerPort {
  readonly errors: ErrorLog[] = [];

  error(message: string, ...args: unknown[]): void {
    this.errors.push({ message, args });
  }

  warn(): void { }

  info(): void { }

  debug(): void { }
}

function validUser(): User<Status> {
  return {
    id: 'user-1',
    createdAt: new Date('2026-07-15T00:00:00.000Z'),
    updatedAt: new Date('2026-07-15T00:00:00.000Z'),
    status: 'active',
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
    passwordHash: 'hashed-password',
    emailVerified: true,
  };
}

test('Expõe todos os handlers do módulo User', () => {
  const executionContext = new ExecutionContext({
    databaseProvider: new DatabaseMock(),
    loggerProvider: new LoggerMock(),
    passwordHashProvider: new PasswordHashMock(),
  });

  const composition = new UserComposition<Status>({
    executionContext,
    userRepository: new UserRepositoryMock(),
    policy: { userStatusPolicy },
  });

  assert.equal(typeof composition.create, 'function');
  assert.equal(typeof composition.update, 'function');
  assert.equal(typeof composition.changeStatus, 'function');
  assert.equal(typeof composition.findById, 'function');
  assert.equal(typeof composition.findByEmail, 'function');
  assert.equal(typeof composition.findByTelephone, 'function');
  assert.equal(typeof composition.findByName, 'function');
});

test('Executa todos os handlers com o repository configurado', async () => {
  const database = new DatabaseMock();
  const users = new UserRepositoryMock();
  const composition = new UserComposition<Status>({
    executionContext: new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    userRepository: users,
    policy: { userStatusPolicy },
  });
  const user = validUser();

  await composition.create(user);

  assert.equal(await composition.findById(user.id), user);
  assert.equal(await composition.findByEmail(user.email.value), user);
  assert.equal(await composition.findByTelephone(user.telephone.value), user);
  assert.deepEqual(await composition.findByName(user.name), [user]);

  const updatedUser = {
    ...user,
    name: 'Marco Aurelio',
    updatedAt: new Date('2026-07-16T00:00:00.000Z'),
  };
  await composition.update(updatedUser);
  assert.equal(await composition.findById(user.id), updatedUser);

  await composition.changeStatus(updatedUser);
  assert.equal(users.users[0]?.status, 'inactive');
});

test('Executa o create pelo pipe e registra erros de domínio', async () => {
  const logger = new RecordingLogger();
  const database = new DatabaseMock();
  const composition = new UserComposition<Status>({
    executionContext: new ExecutionContext({
      databaseProvider: database,
      loggerProvider: logger,
      passwordHashProvider: new PasswordHashMock(),
    }),
    userRepository: new UserRepositoryMock(),
    policy: { userStatusPolicy },
  });
  const user = {
    id: 'user-1',
    createdAt: new Date('2026-07-15T00:00:00.000Z'),
    updatedAt: new Date('2026-07-15T00:00:00.000Z'),
    status: 'active' as Status,
    name: 'Marco',
    email: new Email('invalid-email'),
    telephone: new Telephone('+5511999999999'),
    passwordHash: 'hashed-password',
    emailVerified: true,
  };

  await assert.rejects(
    composition.create(user),
    (error) =>
      error instanceof DomainError && error.code === 'USER_INVALID_EMAIL',
  );

  assert.deepEqual(logger.errors, [
    {
      message: 'User with email invalid-email is invalid.',
      args: [
        {
          code: 'USER_INVALID_EMAIL',
          target: 'src/core/user/domain/user.ts',
          details: {},
        },
      ],
    },
  ]);
  assert.equal(database.started, 0);
});
