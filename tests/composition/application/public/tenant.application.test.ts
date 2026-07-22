import assert from 'node:assert/strict';
import test from 'node:test';
import { createTenantApplication } from '../../../../src/composition/application/public/tenant.application.ts';
import { publicApplicationInput } from './public.application.support.ts';

test('Monta somente a superfície pública de tenant', () => {
  const input = publicApplicationInput();
  const tenant = createTenantApplication({
    executionContext: input.executionContext,
    auditRepository: input.repositories.audits,
    organizationRepository: input.repositories.organizations,
    policy: input.policy.organization,
  });

  assert.equal(typeof tenant.resolve, 'function');
  assert.equal('logger' in tenant, false);
  assert.equal(Object.isFrozen(tenant), true);
});
