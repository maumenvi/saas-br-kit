import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PolicyActor,
  PolicyOrganization,
  PolicyOrganizationSlug,
  RESERVED_ORGANIZATION_SLUGS,
} from '../../src/mocks/status.ts';

test('Interpreta status habilitado para usuários e organizações', () => {
  const actorPolicy = new PolicyActor();
  const organizationPolicy = new PolicyOrganization();
  const organizationSlugPolicy = new PolicyOrganizationSlug();

  assert.equal(actorPolicy.isEnabled('active'), true);
  assert.equal(actorPolicy.isEnabled('inactive'), false);
  assert.equal(organizationPolicy.isEnabled('active'), true);
  assert.equal(organizationPolicy.isEnabled('suspended'), false);
  assert.equal(organizationSlugPolicy.isReserved('admin'), true);
  assert.equal(organizationSlugPolicy.isReserved('maumenvi'), false);
  assert.deepEqual(RESERVED_ORGANIZATION_SLUGS, ['admin', 'api', 'auth', 'www']);
});
