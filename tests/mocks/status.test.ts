import test from 'node:test';
import assert from 'node:assert/strict';
import { PolicyActor, PolicyOrganization } from '../../src/mocks/status.ts';

test('Interpreta status habilitado para usuários e organizações', () => {
  const actorPolicy = new PolicyActor();
  const organizationPolicy = new PolicyOrganization();

  assert.equal(actorPolicy.isEnabled('active'), true);
  assert.equal(actorPolicy.isEnabled('inactive'), false);
  assert.equal(organizationPolicy.isEnabled('active'), true);
  assert.equal(organizationPolicy.isEnabled('suspended'), false);
});
