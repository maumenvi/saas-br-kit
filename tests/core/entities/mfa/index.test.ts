import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CreateMfaKeyUseCase,
  MFA_METHODS,
  MFA_STATUSES,
  MfaErrors,
  ValidateMfaCodeUseCase,
} from '../../../../src/core/entities/mfa/index.ts';

test('Exporta a superfície pública do módulo MFA', () => {
  assert.equal(typeof CreateMfaKeyUseCase, 'function');
  assert.equal(typeof ValidateMfaCodeUseCase, 'function');
  assert.equal(typeof MfaErrors.invalidCode, 'function');
  assert.deepEqual(MFA_METHODS, ['TOTP']);
  assert.deepEqual(MFA_STATUSES, ['PENDING', 'ACTIVE', 'DISABLED']);
});
