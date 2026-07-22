import assert from 'node:assert/strict';
import test from 'node:test';
import {
  VERIFICATION_CHANNELS,
  VERIFICATION_PURPOSES,
  VERIFICATION_STATUSES,
} from '../../../../src/core/entities/verification/verification.ts';

test('Define canais, propósitos e estados do ciclo de verificação', () => {
  assert.deepEqual(VERIFICATION_CHANNELS, ['EMAIL', 'TELEPHONE']);
  assert.deepEqual(VERIFICATION_PURPOSES, [
    'EMAIL_CONFIRMATION',
    'TELEPHONE_CONFIRMATION',
    'ORGANIZATION_INVITATION',
  ]);
  assert.deepEqual(VERIFICATION_STATUSES, [
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'EXPIRED',
  ]);
});
