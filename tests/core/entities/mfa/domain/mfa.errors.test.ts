import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MFA_ERROR_CODE,
  MfaErrors,
} from '../../../../../src/core/entities/mfa/domain/mfa.errors.ts';

test('Cria erros estáveis para o fluxo MFA', () => {
  assert.equal(MfaErrors.actorNotFound('actor-1').code, MFA_ERROR_CODE.MFA_ACTOR_NOT_FOUND);
  assert.equal(MfaErrors.actorTypeNotAllowed('actor-1').code, MFA_ERROR_CODE.MFA_ACTOR_TYPE_NOT_ALLOWED);
  assert.equal(MfaErrors.actorNotEnabled('actor-1').code, MFA_ERROR_CODE.MFA_ACTOR_NOT_ENABLED);
  assert.equal(MfaErrors.alreadyConfigured('actor-1').code, MFA_ERROR_CODE.MFA_ALREADY_CONFIGURED);
  assert.equal(MfaErrors.notConfigured('actor-1').code, MFA_ERROR_CODE.MFA_NOT_CONFIGURED);
  assert.equal(MfaErrors.notActive('actor-1').code, MFA_ERROR_CODE.MFA_NOT_ACTIVE);
  assert.equal(MfaErrors.codeRequired().code, MFA_ERROR_CODE.MFA_CODE_REQUIRED);
  assert.equal(MfaErrors.invalidCode().code, MFA_ERROR_CODE.MFA_INVALID_CODE);
  assert.equal(MfaErrors.codeReused().code, MFA_ERROR_CODE.MFA_CODE_REUSED);
});
