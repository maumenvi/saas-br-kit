import assert from 'node:assert/strict';
import test from 'node:test';
import { ServiceRepositoryMock } from '../../src/mocks/service.repository.ts';
import { service } from '../core/entities/appointment/application/appointment.support.ts';

test('filtra services por organização e ids incluídos', async () => {
  const repository = new ServiceRepositoryMock();
  await repository.save({ ...service, includedServiceIds: ['child'] });
  assert.equal((await repository.findByOrganizationId('organization-1')).length, 1);
  assert.equal((await repository.findByOneOrMoreIncludedServices('organization-1', ['child'])).length, 1);
});
