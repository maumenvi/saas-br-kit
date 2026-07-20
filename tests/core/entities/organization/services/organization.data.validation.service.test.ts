import assert from 'node:assert/strict';
import test from 'node:test';
import { CNPJ } from '../../../../../src/core/entities/organization/domain/cnpj.ts';
import type { Organization } from '../../../../../src/core/entities/organization/organization.ts';
import type { OrganizationRepositoryPort } from '../../../../../src/core/entities/organization/organization.repositories.ts';
import type { OrganizationStatusPolicyPort } from '../../../../../src/core/entities/organization/policies/organizations.status.police.ts';
import { OrganizationDataValidationService } from '../../../../../src/core/entities/organization/services/organization.data.validation.service.ts';

type Status = 'active' | 'inactive';

const statusPolicy: OrganizationStatusPolicyPort<Status> = {
  isEnabled: (status) => status === 'active',
};

function organization(status: Status): Organization<Status> {
  return {
    id: 'organization-1',
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    updatedAt: new Date('2026-07-16T00:00:00.000Z'),
    status,
    name: 'Maumenvi',
    cnpj: new CNPJ('90.021.382/0001-22'),
    ownerActorId: 'actor-1',
  };
}

function repositoryWith(
  result: Organization<Status> | null,
): Pick<OrganizationRepositoryPort<Status, unknown>, 'findById'> {
  return {
    findById: async () => result,
  };
}

test('Retorna dados normalizados da organização habilitada', async () => {
  const service = new OrganizationDataValidationService(
    repositoryWith(organization('active')),
    statusPolicy,
  );

  assert.deepEqual(await service.findById('organization-1'), {
    id: 'organization-1',
    enabled: true,
  });
});

test('Normaliza organização desabilitada sem expor o status', async () => {
  const service = new OrganizationDataValidationService(
    repositoryWith(organization('inactive')),
    statusPolicy,
  );

  assert.deepEqual(await service.findById('organization-1'), {
    id: 'organization-1',
    enabled: false,
  });
});

test('Retorna nulo quando a organização não existe', async () => {
  const service = new OrganizationDataValidationService(
    repositoryWith(null),
    statusPolicy,
  );

  assert.equal(await service.findById('missing-organization'), null);
});
