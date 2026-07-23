import assert from 'node:assert/strict';
import test from 'node:test';
import type { AuthPort } from '../../../../../src/core/entities/auth/auth.port.ts';
import type { CredentialsAuth } from '../../../../../src/core/entities/auth/domain/auth.credentials.ts';
import { AuthCredentialsService } from '../../../../../src/core/entities/auth/services/auth.credentials.service.ts';

test('Delega ao AuthPort o objeto próprio de credentials', async () => {
  const calls: CredentialsAuth[] = [];
  const actor = { actorId: 'client-1', actorType: 'CLIENT' as const };
  const port: AuthPort<CredentialsAuth> = {
    authenticate: async (auth) => {
      calls.push(auth);
      return actor;
    },
  };
  const service = new AuthCredentialsService(port);
  const auth: CredentialsAuth = {
    identifier: 'marco@example.com',
    secret: 'secret',
    organizationId: 'organization-1',
  };

  assert.deepEqual(await service.authenticate(auth), actor);
  assert.deepEqual(calls, [auth]);
});
