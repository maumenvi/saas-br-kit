import assert from 'node:assert/strict';
import test from 'node:test';
import type { OrganizationValidationQueryPort } from '../../../../src/core/entities/organization/organization.validation.query.port.ts';

test('Define o contrato de dados normalizados para validação de organização', async () => {
  const query: OrganizationValidationQueryPort = {
    findById: async (id) => ({
      id,
      enabled: true,
    }),
  };

  assert.deepEqual(await query.findById('organization-1'), {
    id: 'organization-1',
    enabled: true,
  });
});
