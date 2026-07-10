import test from 'node:test';
import assert from 'node:assert/strict';
import { Email, Telephone, USER_ERROR_CODE, UserErrors } from '../../../../src/core/user/domain/index.ts';

test('Exporta os componentes de domínio de User', () => {
  assert.equal(typeof Email, 'function');
  assert.equal(typeof Telephone, 'function');
  assert.equal(typeof UserErrors.invalidEmail, 'function');
  assert.equal(USER_ERROR_CODE.USER_NOT_FOUND, 'USER_NOT_FOUND');
});
