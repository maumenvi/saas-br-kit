import test from 'node:test';
import assert from 'node:assert/strict';
import { UserComposition } from '../../../src/composition/modules/user.composition.ts';
import { ExecutionContext } from '../../../src/core/context/execution.context.ts';
import { CreateUserUseCase } from '../../../src/core/user/application/use-cases/user.create.ts';
import { DatabaseMock } from '../../../src/mocks/database.ts';
import { LoggerMock } from '../../../src/mocks/logger.ts';
import type { Status } from '../../../src/mocks/status.ts';
import { UserRepositoryMock } from '../../../src/mocks/user.repository.ts';

test('Cria os casos de uso do módulo User', () => {
  const executionContext = new ExecutionContext({
    databaseProvider: new DatabaseMock(),
    loggerProvider: new LoggerMock(),
  });

  const composition = new UserComposition<Status>({
    executionContext,
    userRepository: new UserRepositoryMock(),
  });

  assert.ok(composition.create instanceof CreateUserUseCase);
});
