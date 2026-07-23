import assert from 'node:assert/strict';
import test from 'node:test';
import { composeVerificationAccept } from '../../../../src/composition/modules/verification/verification.accept.composition.ts';
import {
  pendingEmailVerification,
  verificationCompositionInput,
} from './verification.composition.support.ts';

test('Compõe aceite público auditado com credencial redigida', async () => {
  const input = await verificationCompositionInput();
  await input.verificationRepository.save(pendingEmailVerification());
  const output = await composeVerificationAccept(input)({
    verificationId: 'verification-1', credential: 'credential-1',
  });
  assert.equal(output.accepted, true);
  assert.deepEqual(input.auditRepository.audits[0]?.input, {
    verificationId: 'verification-1',
    credential: '[REDACTED]',
  });
});
