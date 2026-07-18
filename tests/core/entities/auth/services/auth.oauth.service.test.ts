import assert from 'node:assert/strict';
import test from 'node:test';
import type { AuthPort } from '../../../../../src/core/entities/auth/auth.port.ts';
import type { OAuthAuth } from '../../../../../src/core/entities/auth/domain/auth.oauth.ts';
import { AuthOAuthService } from '../../../../../src/core/entities/auth/services/auth.oauth.service.ts';

test('Delega ao AuthPort o objeto próprio de OAuth', async () => {
  const calls: OAuthAuth[] = [];
  const port: AuthPort<OAuthAuth> = {
    authenticate: async (auth) => {
      calls.push(auth);
      return true;
    },
  };
  const service = new AuthOAuthService(port);
  const auth: OAuthAuth = {
    provider: 'google',
    accessToken: 'oauth-access-token',
    organizationId: 'organization-1',
  };

  assert.equal(await service.authenticate(auth), true);
  assert.deepEqual(calls, [auth]);
});
