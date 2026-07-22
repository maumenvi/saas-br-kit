import assert from 'node:assert/strict';
import test from 'node:test';
import { composeOrganizationChangeStatus } from '../../../../src/composition/modules/organization/organization.change.status.composition.ts';
import { OrganizationRepositoryMock } from '../../../../src/mocks/organization.repository.ts';
import {
  organizationCompositionInput,
  organizationFixture,
} from './organization.composition.support.ts';

test('Monta e executa a mudança de status de organization', async () => {
  const repository = new OrganizationRepositoryMock();
  const organization = organizationFixture();
  await repository.save(organization);

  await composeOrganizationChangeStatus(
    organizationCompositionInput(repository),
  )(organization);

  assert.equal(repository.organizations[0]?.status, 'inactive');
});
