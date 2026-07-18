import assert from 'node:assert/strict';
import test from 'node:test';
import type { OAuthAuth } from '../../../../../src/core/entities/auth/domain/auth.oauth.ts';

test('Define os dados próprios de OAuth', () => {
  const auth: OAuthAuth = {
    provider: 'google',
    accessToken: 'oauth-access-token',
    organizationId: 'organization-1',
  };

  assert.equal(auth.provider, 'google');
});
