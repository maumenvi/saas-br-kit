import assert from 'node:assert/strict';
import test from 'node:test';
import type { CredentialsAuth } from '../../../../../src/core/entities/auth/domain/auth.credentials.ts';

test('Define os dados próprios de credentials', () => {
  const auth: CredentialsAuth = {
    identifier: 'marco@example.com',
    secret: 'secret',
    organizationId: 'organization-1',
  };

  assert.equal(auth.identifier, 'marco@example.com');
});
