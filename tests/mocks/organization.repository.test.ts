import test from 'node:test';
import assert from 'node:assert/strict';
import type { Organization } from '../../src/core/entities/organization/organization.ts';
import { CNPJ } from '../../src/core/entities/organization/domain/cnpj.ts';
import { OrganizationSlug } from '../../src/core/entities/organization/domain/organization.slug.ts';
import { OrganizationRepositoryMock } from '../../src/mocks/organization.repository.ts';
import type { Status } from '../../src/mocks/status.ts';

function organization(
  id = 'organization-1',
  cnpj = '90.021.382/0001-22',
  slug = 'maumenvi',
): Organization<Status> {
  return {
    id,
    createdAt: new Date('2026-07-14T00:00:00.000Z'),
    updatedAt: new Date('2026-07-14T00:00:00.000Z'),
    status: 'active',
    name: 'Maumenvi',
    slug: new OrganizationSlug(slug),
    cnpj: new CNPJ(cnpj),
    ownerActorId: 'actor-1',
  };
}

test('Salva e localiza organizações por id, CNPJ e slug', async () => {
  const repository = new OrganizationRepositoryMock();
  const first = organization();
  const second = organization(
    'organization-2',
    '90.024.778/0001-23',
    'empresa-x',
  );

  await repository.save(first);
  await repository.save(second);

  assert.equal(await repository.findById(first.id), first);
  assert.equal(await repository.findByCnpj(second.cnpj.value), second);
  assert.equal(await repository.findBySlug(second.slug.value), second);
  assert.equal(await repository.findById('missing'), null);
  assert.equal(await repository.findBySlug('missing'), null);
});

test('Atualiza uma organização existente', async () => {
  const repository = new OrganizationRepositoryMock();
  const current = organization();
  const updated = {
    ...current,
    name: 'Maumenvi Tecnologia',
    updatedAt: new Date('2026-07-14T12:00:00.000Z'),
  };
  await repository.save(current);

  await repository.update(updated);

  assert.deepEqual(repository.organizations, [updated]);
});

test('Altera o status de uma organização existente', async () => {
  const repository = new OrganizationRepositoryMock();
  const current = organization();
  await repository.save(current);

  await repository.changeStatus(current);

  assert.equal(repository.organizations[0]?.status, 'inactive');
});
