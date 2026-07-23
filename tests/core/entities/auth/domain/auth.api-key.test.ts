import assert from 'node:assert/strict';
import test from 'node:test';
import type { ApiKeyAuth } from '../../../../../src/core/entities/auth/domain/auth.api-key.ts';

test('Define os dados próprios de API key', () => {
  const auth: ApiKeyAuth = {
    apiKey: 'api-key-value',
    organizationId: 'organization-1',
  };

  assert.equal(auth.apiKey, 'api-key-value');
});
