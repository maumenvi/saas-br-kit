import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { ChangeCustomerStatusUseCase } from '../../../../../src/core/entities/customer/application/customer.change.status.ts';
import type { CustomerRepositoryPort } from '../../../../../src/core/entities/customer/customer.repositories.ts';
import type { Customer } from '../../../../../src/core/entities/customer/customer.ts';

test('ChangeCustomerStatusUseCase delega a operação ao repository', async () => {
  const customer = { id: 'customer-1', status: 'active' } as Customer<'active'>;
  let received: Customer<'active'> | undefined;
  const repository = {
    changeStatus: async (value: Customer<'active'>) => {
      received = value;
      
    },
  } as unknown as CustomerRepositoryPort<'active'>;
  const executionContext = {
    databaseProvider: {
      run: async (callback: (transaction: unknown) => Promise<unknown>) => callback(undefined),
    },
  } as ExecutionContext;
  const useCase = new ChangeCustomerStatusUseCase(executionContext, repository);

  await useCase.changeStatus(customer);

  assert.equal(received, customer);
  
});
