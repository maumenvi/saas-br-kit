import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MFA_METHODS,
  MFA_STATUSES,
  type Mfa,
} from '../../../../src/core/entities/mfa/mfa.ts';

test('Declara o contrato e os valores runtime de MFA', () => {
  const mfa = undefined as Mfa | undefined;

  assert.deepEqual(MFA_METHODS, ['TOTP']);
  assert.deepEqual(MFA_STATUSES, ['PENDING', 'ACTIVE', 'DISABLED']);
  void mfa;
});
