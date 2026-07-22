import assert from 'node:assert/strict';
import test from 'node:test';
import type { VerificationCredentialPort } from '../../../../src/core/entities/verification/verification.credential.port.ts';

test('Permite emitir e validar credenciais sem expor implementação ao Core', async () => {
  const port: VerificationCredentialPort = {
    issue: async () => ({ value: '123456', hash: 'hashed' }),
    verify: async (value, hash) => value === '123456' && hash === 'hashed',
  };
  assert.equal((await port.issue('EMAIL_CONFIRMATION')).hash, 'hashed');
  assert.equal(await port.verify('123456', 'hashed'), true);
});
