import assert from 'node:assert/strict';
import test from 'node:test';
import { composeVerificationExpirePending } from '../../../../src/composition/modules/verification/verification.expire.composition.ts';
import {
  pendingEmailVerification,
  verificationCompositionInput,
} from './verification.composition.support.ts';

test('Compõe a expiração em lote para execução por worker', async () => {
  const input = await verificationCompositionInput();
  await input.verificationRepository.save({
    ...pendingEmailVerification(),
    expiresAt: new Date('2026-07-22T11:59:00.000Z'),
  });
  assert.equal(await composeVerificationExpirePending(input)(undefined), 1);
});
