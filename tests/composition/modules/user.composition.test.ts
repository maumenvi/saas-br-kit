import test from 'node:test';
import assert from 'node:assert/strict';
import { UserComposition } from '../../../src/composition/modules/user.composition.ts';
import { ExecutionContext } from '../../../src/core/context/execution.context.ts';
import type { LoggerPort } from '../../../src/core/ports/logger.port.ts';
import { DomainError } from '../../../src/core/shared/domain/domain.error.ts';
import { CreateUserUseCase } from '../../../src/core/user/application/use-cases/user.create.ts';
import { Email } from '../../../src/core/user/domain/email.ts';
import { Telephone } from '../../../src/core/user/domain/telephone.ts';
import { DatabaseMock } from '../../../src/mocks/database.ts';
import { LoggerMock } from '../../../src/mocks/logger.ts';
import type { Status } from '../../../src/mocks/status.ts';
import { UserRepositoryMock } from '../../../src/mocks/user.repository.ts';

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

test('Cria os casos de uso do módulo User', () => {
  const executionContext = new ExecutionContext({
    databaseProvider: new DatabaseMock(),
    loggerProvider: new LoggerMock(),
  });

  const composition = new UserComposition<Status>({
    executionContext,
    userRepository: new UserRepositoryMock(),
  });

  assert.ok(composition.create instanceof Function);
});

test('Executa o create pelo pipe e registra erros de domínio', async () => {
  const logger = new RecordingLogger();
  const database = new DatabaseMock();
  const composition = new UserComposition<Status>({
    executionContext: new ExecutionContext({
      databaseProvider: database,
      loggerProvider: logger,
    }),
    userRepository: new UserRepositoryMock(),
  });
  const user = {
    id: 'user-1',
    createdAt: new Date('2026-07-15T00:00:00.000Z'),
    updatedAt: new Date('2026-07-15T00:00:00.000Z'),
    status: 'active' as Status,
    name: 'Marco',
    email: new Email('invalid-email'),
    telephone: new Telephone('+5511999999999'),
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
