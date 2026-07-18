import assert from 'node:assert/strict';
import test from 'node:test';
import type { LoginAuth } from '../../../../../src/core/entities/auth/domain/auth.login.ts';

test('Define os dados próprios do login', () => {
  const auth: LoginAuth = {
    email: 'marco@example.com',
    password: 'secret',
    organizationId: 'organization-1',
  };

  assert.equal(auth.email, 'marco@example.com');
});
