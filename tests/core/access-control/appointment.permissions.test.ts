import assert from 'node:assert/strict';
import test from 'node:test';
import { APPOINTMENT_PERMISSION_KEYS } from '../../../src/core/access-control/appointment.permissions.ts';

test('declara permissão específica para cancelamento', () => {
  assert.equal(APPOINTMENT_PERMISSION_KEYS.includes('appointment:cancel'), true);
});
