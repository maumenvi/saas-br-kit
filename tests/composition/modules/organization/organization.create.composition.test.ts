import assert from 'node:assert/strict';
import test from 'node:test';
import { composeOrganizationCreate } from '../../../../src/composition/modules/organization/organization.create.composition.ts';
import { OrganizationRepositoryMock } from '../../../../src/mocks/organization.repository.ts';
import {
  organizationCompositionInput,
  organizationFixture,
} from './organization.composition.support.ts';

test('Monta e executa o create de organization', async () => {
  const repository = new OrganizationRepositoryMock();
  const organization = organizationFixture();

  await composeOrganizationCreate(organizationCompositionInput(repository))(
    organization,
  );

  assert.deepEqual(await repository.findById(organization.id), organization);
});
