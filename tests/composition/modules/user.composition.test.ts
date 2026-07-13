import test from 'node:test';
import assert from 'node:assert/strict';
import { UserComposition } from '../../../src/composition/modules/user.composition.ts';
import { CreateUserUseCase, ExecutionContext } from '../../../src/core/index.ts';
import { DatabaseMock, LoggerMock, type Status, UserRepositoryMock } from '../../../src/mocks/index.ts';
import { OrganizationRepositoryMock } from '../../../src/mocks/organization.repository.ts';

test('Cria os casos de uso do módulo User', () => {
  const executionContext = new ExecutionContext({
    databaseProvider: new DatabaseMock(),
    loggerProvider: new LoggerMock(),
  });

  const composition = new UserComposition<Status, Status>({
    executionContext,
    userRepository: new UserRepositoryMock(),
    organizationRepository: new OrganizationRepositoryMock(),
  });

  assert.ok(composition.create instanceof CreateUserUseCase);
});
