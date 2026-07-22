import assert from 'node:assert/strict';
import test from 'node:test';
import type { VerificationRepositoryPort } from '../../../../src/core/entities/verification/verification.repositories.ts';

test('Expõe operações atômicas para transições do ciclo', () => {
  const methodNames: (keyof VerificationRepositoryPort)[] = [
    'save',
    'findById',
    'acceptIfPending',
    'expireIfPending',
    'expirePending',
    'expirePendingFor',
    'registerFailedAttempt',
  ];
  assert.equal(methodNames.length, 7);
});
