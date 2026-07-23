import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { FindCustomerByIdUseCase } from '../../../../../src/core/entities/customer/application/customer.find.ts';
import type { CustomerRepositoryPort } from '../../../../../src/core/entities/customer/customer.repositories.ts';
import type { Customer } from '../../../../../src/core/entities/customer/customer.ts';

test('FindCustomerByIdUseCase delega a operação ao repository', async () => {
  const customer = {
    id: 'customer-1',
    status: 'active',
    organizationId: 'organization-1',
  } as Customer<'active'>;
  let received: string | undefined;
  const repository = {
    findById: async (value: string) => {
      received = value;
      return customer;
    },
  } as unknown as CustomerRepositoryPort<'active'>;
  const executionContext = {
    databaseProvider: {
      run: async (callback: (transaction: unknown) => Promise<unknown>) => callback(undefined),
    },
  } as ExecutionContext;
  const useCase = new FindCustomerByIdUseCase(executionContext, repository);

  const result = await useCase.findById('organization-1', customer.id);

  assert.equal(received, customer.id);
  assert.equal(result, customer);
});
