import assert from 'node:assert/strict';
import test from 'node:test';
import type { VerificationCompositionInput } from '../../../../src/composition/modules/verification/verification.composition.input.ts';
import { verificationCompositionInput } from './verification.composition.support.ts';

test('Agrupa dependências da composição de verification', async () => {
  const input: VerificationCompositionInput<string, string> = await verificationCompositionInput();
  assert.ok(input.verificationRepository);
  assert.ok(input.verification.credentialProvider);
});
