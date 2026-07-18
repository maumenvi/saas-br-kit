import assert from 'node:assert/strict';
import test from 'node:test';
import type { AuthPort } from '../../../../../src/core/entities/auth/auth.port.ts';
import type { CredentialsAuth } from '../../../../../src/core/entities/auth/domain/auth.credentials.ts';
import { AuthCredentialsService } from '../../../../../src/core/entities/auth/services/auth.credentials.service.ts';

test('Delega ao AuthPort o objeto próprio de credentials', async () => {
  const calls: CredentialsAuth[] = [];
  const port: AuthPort<CredentialsAuth> = {
    authenticate: async (auth) => {
      calls.push(auth);
      return true;
    },
  };
  const service = new AuthCredentialsService(port);
  const auth: CredentialsAuth = {
    identifier: 'marco@example.com',
    secret: 'secret',
    organizationId: 'organization-1',
  };

  assert.equal(await service.authenticate(auth), true);
  assert.deepEqual(calls, [auth]);
});
