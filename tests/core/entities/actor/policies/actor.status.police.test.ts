import assert from 'node:assert/strict';
import test from 'node:test';
import type { ActorStatusPolicyPort } from '../../../../../src/core/entities/actor/policies/actor.status.police.ts';

test('Define o contrato para interpretar o status de actor', () => {
  const policy: ActorStatusPolicyPort<'active' | 'inactive'> = {
    isEnabled: (status) => status === 'active',
  };

  assert.equal(policy.isEnabled('active'), true);
  assert.equal(policy.isEnabled('inactive'), false);
});
