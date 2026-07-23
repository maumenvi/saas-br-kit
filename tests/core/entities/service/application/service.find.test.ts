import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { FindServiceByIdUseCase } from '../../../../../src/core/entities/service/application/service.find.ts';
import type { ServiceRepositoryPort } from '../../../../../src/core/entities/service/service.repositories.ts';
import type { Service } from '../../../../../src/core/entities/service/service.ts';

test('FindServiceByIdUseCase delega a operação ao repository', async () => {
  const service = {
    id: 'service-1',
    status: 'active',
    organizationId: 'organization-1',
  } as Service<'active'>;
  let received: string | undefined;
  const repository = {
    findById: async (value: string) => {
      received = value;
      return service;
    },
  } as unknown as ServiceRepositoryPort<'active'>;
  const executionContext = {
    databaseProvider: {
      run: async (callback: (transaction: unknown) => Promise<unknown>) => callback(undefined),
    },
  } as ExecutionContext;
  const useCase = new FindServiceByIdUseCase(executionContext, repository);

  const result = await useCase.findById('organization-1', service.id);

  assert.equal(received, service.id);
  assert.equal(result, service);
});
