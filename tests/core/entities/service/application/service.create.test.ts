import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { CreateServiceUseCase } from '../../../../../src/core/entities/service/application/service.create.ts';
import type { ServiceRepositoryPort } from '../../../../../src/core/entities/service/service.repositories.ts';
import type { Service } from '../../../../../src/core/entities/service/service.ts';

test('CreateServiceUseCase delega a operação ao repository', async () => {
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
    save: async (value: Service<'active'>) => {
      received = value;
      
    },
  } as unknown as ServiceRepositoryPort<'active'>;
  const executionContext = {
    databaseProvider: {
      run: async (callback: (transaction: unknown) => Promise<unknown>) => callback(undefined),
    },
  } as ExecutionContext;
  const useCase = new CreateServiceUseCase(executionContext, repository);

  await useCase.execute(service);

  assert.deepEqual(received, service);
  
});
