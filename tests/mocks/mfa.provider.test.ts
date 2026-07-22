import assert from 'node:assert/strict';
import test from 'node:test';
import { MfaProviderMock } from '../../src/mocks/mfa.provider.ts';

test('Gera e valida credenciais MFA determinísticas', async () => {
  const provider = new MfaProviderMock();

  const key = await provider.createKey({ issuer: 'SaaS BR', label: 'actor@example.com' });

  assert.equal(key.secret, 'secret-actor@example.com');
  assert.deepEqual(
    await provider.validateCode({ providerCredential: key.providerCredential, code: '123456' }),
    { valid: true, counter: 1 },
  );
  assert.deepEqual(
    await provider.validateCode({ providerCredential: key.providerCredential, code: '000000' }),
    { valid: false },
  );
});
