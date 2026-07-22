import assert from 'node:assert/strict';
import test from 'node:test';
import {
  VERIFICATION_ERROR_CODE,
  VerificationErrors,
} from '../../../../../src/core/entities/verification/domain/verification.errors.ts';

test('Cria erros estáveis para as transições de verificação', () => {
  assert.equal(VerificationErrors.notFound('v-1').code, VERIFICATION_ERROR_CODE.NOT_FOUND);
  assert.equal(VerificationErrors.invalidCredential().code, VERIFICATION_ERROR_CODE.INVALID_CREDENTIAL);
  assert.equal(VerificationErrors.expired('v-1').code, VERIFICATION_ERROR_CODE.EXPIRED);
  assert.equal(VerificationErrors.rejected('v-1').code, VERIFICATION_ERROR_CODE.REJECTED);
  assert.equal(VerificationErrors.alreadyAccepted('v-1').code, VERIFICATION_ERROR_CODE.ALREADY_ACCEPTED);
  assert.equal(VerificationErrors.transitionConflict('v-1').code, VERIFICATION_ERROR_CODE.TRANSITION_CONFLICT);
  assert.equal(VerificationErrors.invalidConfig('maxAttempts').code, VERIFICATION_ERROR_CODE.INVALID_CONFIG);
  assert.equal(VerificationErrors.contactAlreadyVerified('a-1', 'EMAIL_CONFIRMATION').code, VERIFICATION_ERROR_CODE.CONTACT_ALREADY_VERIFIED);
  assert.equal(VerificationErrors.contactChanged('a-1', 'EMAIL_CONFIRMATION').code, VERIFICATION_ERROR_CODE.CONTACT_CHANGED);
});
