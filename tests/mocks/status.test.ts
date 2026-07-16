import test from 'node:test';
import assert from 'node:assert/strict';
import { PolicyOrganization, PolicyUser } from '../../src/mocks/status.ts';

test('Interpreta status habilitado para usuários e organizações', () => {
  const userPolicy = new PolicyUser();
  const organizationPolicy = new PolicyOrganization();

  assert.equal(userPolicy.isEnabled('active'), true);
  assert.equal(userPolicy.isEnabled('inactive'), false);
  assert.equal(organizationPolicy.isEnabled('active'), true);
  assert.equal(organizationPolicy.isEnabled('suspended'), false);
});
