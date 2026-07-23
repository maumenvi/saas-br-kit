import test from 'node:test';
import type { AppointmentStatusPolicy } from '../../../../../src/core/entities/appointment/policies/appointment.status.policy.ts';

test('declara a policy de status do appointment', () => {
  const policy = undefined as AppointmentStatusPolicy<string> | undefined;
  void policy;
});
