import assert from 'node:assert/strict';
import test from 'node:test';
import { MfaComposition } from '../../../../src/composition/modules/mfa/mfa.composition.ts';
import { mfaCompositionInput } from './mfa.composition.support.ts';

test('Agrupa os handlers do módulo MFA', () => {
  const composition = new MfaComposition(mfaCompositionInput());

  assert.equal(typeof composition.createKey, 'function');
  assert.equal(typeof composition.validateCode, 'function');
});
