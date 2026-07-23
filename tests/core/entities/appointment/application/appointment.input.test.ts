import test from 'node:test';
import type { CreateAppointmentInput } from '../../../../../src/core/entities/appointment/application/appointment.input.ts';

test('declara o input de criação de appointment', () => {
  const input = undefined as CreateAppointmentInput<string> | undefined;
  void input;
});
