import assert from 'node:assert/strict';
import test from 'node:test';
import type { AuthPort } from '../../../../../src/core/entities/auth/auth.port.ts';
import type { ApiKeyAuth } from '../../../../../src/core/entities/auth/domain/auth.api-key.ts';
import { AuthApiKeyService } from '../../../../../src/core/entities/auth/services/auth.api-key.service.ts';

test('Delega ao AuthPort o objeto próprio de API key', async () => {
  const calls: ApiKeyAuth[] = [];
  const port: AuthPort<ApiKeyAuth> = {
    authenticate: async (auth) => {
      calls.push(auth);
      return true;
    },
  };
  const service = new AuthApiKeyService(port);
  const auth: ApiKeyAuth = {
    apiKey: 'api-key-value',
    organizationId: 'organization-1',
  };

  assert.equal(await service.authenticate(auth), true);
  assert.deepEqual(calls, [auth]);
});
