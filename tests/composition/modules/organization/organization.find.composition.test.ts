import assert from 'node:assert/strict';
import test from 'node:test';
import {
  composeOrganizationFindByCnpj,
  composeOrganizationFindById,
  composeOrganizationFindBySlug,
} from '../../../../src/composition/modules/organization/organization.find.composition.ts';
import { OrganizationRepositoryMock } from '../../../../src/mocks/organization.repository.ts';
import {
  organizationCompositionInput,
  organizationFixture,
} from './organization.composition.support.ts';

test('Monta e executa as consultas de organization', async () => {
  const repository = new OrganizationRepositoryMock();
  const organization = organizationFixture();
  const input = organizationCompositionInput(repository);
  await repository.save(organization);

  assert.equal(
    await composeOrganizationFindById(input)(organization.id),
    organization,
  );
  assert.equal(
    await composeOrganizationFindByCnpj(input)(organization.cnpj.value),
    organization,
  );
  assert.equal(
    await composeOrganizationFindBySlug(input)(organization.slug.value),
    organization,
  );
});
