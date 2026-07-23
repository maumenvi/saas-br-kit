import assert from 'node:assert/strict';
import test from 'node:test';
import { composeOrganizationUpdate } from '../../../../src/composition/modules/organization/organization.update.composition.ts';
import { OrganizationRepositoryMock } from '../../../../src/mocks/organization.repository.ts';
import {
  organizationCompositionInput,
  organizationFixture,
} from './organization.composition.support.ts';

test('Monta e executa o update de organization', async () => {
  const repository = new OrganizationRepositoryMock();
  const organization = organizationFixture();
  const updated = { ...organization, name: 'Maumenvi Tecnologia' };
  await repository.save(organization);

  await composeOrganizationUpdate(organizationCompositionInput(repository))(
    updated,
  );

  assert.deepEqual(await repository.findById(organization.id), updated);
});
