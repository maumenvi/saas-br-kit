import assert from 'node:assert/strict';
import test from 'node:test';
import { VerificationComposition } from '../../../../src/composition/modules/verification/verification.composition.ts';
import { verificationCompositionInput } from './verification.composition.support.ts';

test('Expõe os handlers de aceite e expiração', async () => {
  const composition = new VerificationComposition(await verificationCompositionInput());
  assert.equal(typeof composition.accept, 'function');
  assert.equal(typeof composition.expirePending, 'function');
});
