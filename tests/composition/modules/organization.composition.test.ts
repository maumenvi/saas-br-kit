import test from 'node:test';
import assert from 'node:assert/strict';
import { OrganizationComposition } from '../../../src/composition/modules/organization.composition.ts';
import { ExecutionContext } from '../../../src/core/context/execution.context.ts';
import { OrganizationCreateUseCase } from '../../../src/core/organization/application/use-cases/organization.create.ts';
import { DatabaseMock } from '../../../src/mocks/database.ts';
import { LoggerMock } from '../../../src/mocks/logger.ts';
import { OrganizationRepositoryMock } from '../../../src/mocks/organization.repository.ts';
import type { Status } from '../../../src/mocks/status.ts';

test('Cria os casos de uso do módulo Organization', () => {
  const executionContext = new ExecutionContext({
    databaseProvider: new DatabaseMock(),
    loggerProvider: new LoggerMock(),
  });

  const composition = new OrganizationComposition<Status>({
    executionContext,
    organizationRepository: new OrganizationRepositoryMock(),
  });

  assert.ok(composition.create instanceof OrganizationCreateUseCase);
});
