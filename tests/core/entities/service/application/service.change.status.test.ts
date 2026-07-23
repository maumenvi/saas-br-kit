import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { ChangeServiceStatusUseCase } from '../../../../../src/core/entities/service/application/service.change.status.ts';
import type { ServiceRepositoryPort } from '../../../../../src/core/entities/service/service.repositories.ts';
import type { Service } from '../../../../../src/core/entities/service/service.ts';

test('ChangeServiceStatusUseCase delega a operação ao repository', async () => {
  const service = { id: 'service-1', status: 'active' } as Service<'active'>;
  let received: Service<'active'> | undefined;
  const repository = {
    changeStatus: async (value: Service<'active'>) => {
      received = value;
      
    },
  } as unknown as ServiceRepositoryPort<'active'>;
  const executionContext = {
    databaseProvider: {
      run: async (callback: (transaction: unknown) => Promise<unknown>) => callback(undefined),
    },
  } as ExecutionContext;
  const useCase = new ChangeServiceStatusUseCase(executionContext, repository);

  await useCase.changeStatus(service);

  assert.equal(received, service);
  
});
