import assert from 'node:assert/strict';
import test from 'node:test';
import {
  VerificationCredentialMock,
  verificationConfigMock,
} from '../../src/mocks/verification.credential.ts';

test('Emite credenciais determinísticas e valida somente o hash correspondente', async () => {
  const provider = new VerificationCredentialMock();
  const issued = await provider.issue('EMAIL_CONFIRMATION');
  assert.deepEqual(issued, { value: 'credential-1', hash: 'hash:credential-1' });
  assert.equal(await provider.verify(issued.value, issued.hash), true);
  assert.equal(await provider.verify('wrong', issued.hash), false);
  assert.equal(verificationConfigMock().maxAttempts, 5);
});
