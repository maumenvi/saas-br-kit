import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { UpdateServiceUseCase } from '../../../../../src/core/entities/service/application/service.update.ts';
import type { ServiceRepositoryPort } from '../../../../../src/core/entities/service/service.repositories.ts';
import type { Service } from '../../../../../src/core/entities/service/service.ts';

test('UpdateServiceUseCase delega a operação ao repository', async () => {
  const service = {
    id: 'service-1',
    status: 'active',
    organizationId: 'organization-1',
    name: 'Corte',
    description: 'Corte',
    price: 5000,
    durationMinutes: 60,
    includedServiceIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Service<'active'>;
  let received: Service<'active'> | undefined;
  const repository = {
    update: async (value: Service<'active'>) => {
      received = value;
      
    },
  } as unknown as ServiceRepositoryPort<'active'>;
  const executionContext = {
    databaseProvider: {
      run: async (callback: (transaction: unknown) => Promise<unknown>) => callback(undefined),
    },
  } as ExecutionContext;
  const useCase = new UpdateServiceUseCase(executionContext, repository);

  await useCase.update(service);

  assert.equal(received, service);
  
});
