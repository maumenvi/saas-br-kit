import assert from 'node:assert/strict';
import test from 'node:test';
import type { OrganizationStatusPolicyPort } from '../../../../../src/core/entities/organization/policies/organizations.status.police.ts';

test('Define o contrato para interpretar o status de organização', () => {
  const policy: OrganizationStatusPolicyPort<'active' | 'inactive'> = {
    isEnabled: (status) => status === 'active',
  };

  assert.equal(policy.isEnabled('active'), true);
  assert.equal(policy.isEnabled('inactive'), false);
});
