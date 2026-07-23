import assert from 'node:assert/strict';
import test from 'node:test';
import { createMfaPermissionScope } from '../../../../src/composition/application/permission/mfa.permission.application.ts';
import { mfaCompositionInput } from '../../modules/mfa/mfa.composition.support.ts';

test('Expõe somente a superfície protegida e congelada de MFA', () => {
  const application = createMfaPermissionScope(mfaCompositionInput());

  assert.equal(typeof application.createKey, 'function');
  assert.equal(typeof application.validateCode, 'function');
  assert.equal('logger' in application, false);
  assert.equal(Object.isFrozen(application), true);
});
