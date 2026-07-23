import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AUTH_ERROR_CODE,
  AUTH_TYPES,
  AuthErrors,
  AuthUseCase,
  type ApiKeyAuth,
  type Auth,
  type AuthPort,
  type CredentialsAuth,
  type LoginAuth,
  type OAuthAuth,
} from '../../../../src/core/entities/auth/index.ts';

test('Exporta o caso de uso do módulo Auth', () => {
  assert.equal(AUTH_ERROR_CODE.AUTH_FAILED, 'AUTH_FAILED');
  assert.equal(AuthErrors.authFailed().code, AUTH_ERROR_CODE.AUTH_FAILED);
  assert.equal(typeof AuthUseCase, 'function');
  assert.deepEqual(AUTH_TYPES, [
    'LOGIN',
    'CREDENTIALS',
    'OAUTH',
    'API_KEY',
    'CUSTOM',
  ]);

  const inputs: [LoginAuth, CredentialsAuth, OAuthAuth, ApiKeyAuth] = [
    { email: 'user@example.com', password: 'secret', organizationId: 'org-1' },
    { identifier: 'user@example.com', secret: 'secret', organizationId: 'org-1' },
    { provider: 'google', accessToken: 'token', organizationId: 'org-1' },
    { apiKey: 'key', organizationId: 'org-1' },
  ];
  const apiKeyPort: AuthPort<ApiKeyAuth> = {
    authenticate: async (auth) => auth.apiKey.length > 0
      ? { actorId: 'service-1', actorType: 'SERVICE' }
      : null,
  };
  const legacyLoginAuth: Auth = inputs[0];

  assert.equal(inputs.length, 4);
  assert.equal(legacyLoginAuth.email, 'user@example.com');
  assert.equal(typeof apiKeyPort.authenticate, 'function');
});
