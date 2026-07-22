import assert from 'node:assert/strict';
import test from 'node:test';
import * as verification from '../../../../src/core/entities/verification/index.ts';

test('Exporta a superfície pública de verification', () => {
  assert.equal(typeof verification.RequestVerificationUseCase, 'function');
  assert.equal(typeof verification.AcceptVerificationUseCase, 'function');
  assert.equal(typeof verification.ExpireVerificationsUseCase, 'function');
  assert.equal(typeof verification.VerificationErrors, 'object');
});
