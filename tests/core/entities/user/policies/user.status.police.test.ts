import assert from 'node:assert/strict';
import test from 'node:test';
import type { UserStatusPolicyPort } from '../../../../../src/core/entities/user/policies/user.status.police.ts';

test('Define o contrato para interpretar o status de usuário', () => {
  const policy: UserStatusPolicyPort<'active' | 'inactive'> = {
    isEnabled: (status) => status === 'active',
  };

  assert.equal(policy.isEnabled('active'), true);
  assert.equal(policy.isEnabled('inactive'), false);
});
