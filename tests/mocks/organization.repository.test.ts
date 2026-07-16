import test from 'node:test';
import assert from 'node:assert/strict';
import type { Organization } from '../../src/core/entities/organization/application/organization.input.ts';
import { CNPJ } from '../../src/core/entities/organization/domain/cnpj.ts';
import { OrganizationRepositoryMock } from '../../src/mocks/organization.repository.ts';
import type { Status } from '../../src/mocks/status.ts';

function organization(
  id = 'organization-1',
  cnpj = '90.021.382/0001-22',
): Organization<Status> {
  return {
    id,
    createdAt: new Date('2026-07-14T00:00:00.000Z'),
    updatedAt: new Date('2026-07-14T00:00:00.000Z'),
    status: 'active',
    name: 'Maumenvi',
    cnpj: new CNPJ(cnpj),
  };
}

test('Salva e localiza organizações por id e CNPJ', async () => {
  const repository = new OrganizationRepositoryMock();
  const first = organization();
  const second = organization('organization-2', '90.024.778/0001-23');

  await repository.save(first);
  await repository.save(second);

  assert.equal(await repository.findById(first.id), first);
  assert.equal(await repository.findByCnpj(second.cnpj.value), second);
  assert.equal(await repository.findById('missing'), null);
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
