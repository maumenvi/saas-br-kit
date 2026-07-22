import assert from 'node:assert/strict';
import test from 'node:test';
import { composeMfaCreateKey } from '../../../../src/composition/modules/mfa/mfa.create-key.composition.ts';
import { composeMfaValidateCode } from '../../../../src/composition/modules/mfa/mfa.validate-code.composition.ts';
import { mfaCompositionInput, saveUser } from './mfa.composition.support.ts';

test('Monta e executa a validação protegida do código MFA', async () => {
  const input = mfaCompositionInput();
  await saveUser(input.actorRepository);
  await composeMfaCreateKey(input)(undefined);

  const output = await composeMfaValidateCode(input)({ code: '123456' });

  assert.deepEqual(output, { valid: true, activated: true });
  assert.equal(input.mfaRepository.mfas[0]?.status, 'ACTIVE');
  assert.equal(input.auditRepository.audits[1]?.action, 'mfa:validate-code');
  assert.equal(
    (input.auditRepository.audits[1]?.input as { code: string }).code,
    '[REDACTED]',
  );
});
