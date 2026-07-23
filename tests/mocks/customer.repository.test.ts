import assert from 'node:assert/strict';
import test from 'node:test';
import { CustomerRepositoryMock } from '../../src/mocks/customer.repository.ts';
import { customer } from '../core/entities/appointment/application/appointment.support.ts';

test('isola customer por organização', async () => {
  const repository = new CustomerRepositoryMock();
  await repository.save(customer);
  assert.equal((await repository.findByEmail('organization-1', customer.email)).length, 1);
  assert.equal((await repository.findByEmail('organization-2', customer.email)).length, 0);
});
