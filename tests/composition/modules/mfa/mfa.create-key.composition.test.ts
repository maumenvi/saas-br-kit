import assert from 'node:assert/strict';
import test from 'node:test';
import { composeMfaCreateKey } from '../../../../src/composition/modules/mfa/mfa.create-key.composition.ts';
import { mfaCompositionInput, saveUser } from './mfa.composition.support.ts';

test('Monta e executa a criação protegida de chave MFA', async () => {
  const input = mfaCompositionInput();
  await saveUser(input.actorRepository);

  const output = await composeMfaCreateKey(input)(undefined);

  assert.equal(input.mfaRepository.mfas[0]?.actorId, input.permissionContext.actorId);
  assert.equal(output.secret, 'secret-marco@example.com');
  assert.equal(input.auditRepository.audits[0]?.action, 'mfa:create-key');
  assert.equal(
    (input.auditRepository.audits[0]?.output as { secret: string }).secret,
    '[REDACTED]',
  );
  assert.equal(
    (input.auditRepository.audits[0]?.output as { provisioningUri: string }).provisioningUri,
    '[REDACTED]',
  );
});
