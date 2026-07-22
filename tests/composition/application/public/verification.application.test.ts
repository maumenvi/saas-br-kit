import assert from 'node:assert/strict';
import test from 'node:test';
import { createVerificationApplication } from '../../../../src/composition/application/public/verification.application.ts';
import { verificationCompositionInput } from '../../modules/verification/verification.composition.support.ts';

test('Monta somente a superfície pública de verification', async () => {
  const application = createVerificationApplication(await verificationCompositionInput());
  assert.deepEqual(Object.keys(application), ['accept', 'expirePending']);
  assert.equal(Object.isFrozen(application), true);
});
