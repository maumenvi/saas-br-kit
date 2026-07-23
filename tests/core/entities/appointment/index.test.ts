import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ChangeAppointmentStatusUseCase,
  CreateAppointmentUseCase,
  FindAppointmentByIdUseCase,
  UpdateAppointmentUseCase,
  CancelAppointmentByActorUseCase,
  RespondAppointmentUseCase,
  RequestAppointmentResponseVerificationUseCase,
  AppointmentNotificationUseCase,
  APPOINTMENT_PAYMENT_TYPES,
} from '../../../../src/core/entities/appointment/index.ts';

test('Exporta os casos de uso do módulo Appointment', () => {
  assert.equal(typeof ChangeAppointmentStatusUseCase, 'function');
  assert.equal(typeof CreateAppointmentUseCase, 'function');
  assert.equal(typeof FindAppointmentByIdUseCase, 'function');
  assert.equal(typeof UpdateAppointmentUseCase, 'function');
  assert.equal(typeof CancelAppointmentByActorUseCase, 'function');
  assert.equal(typeof RespondAppointmentUseCase, 'function');
  assert.equal(typeof RequestAppointmentResponseVerificationUseCase, 'function');
  assert.equal(typeof AppointmentNotificationUseCase, 'function');
  assert.equal(APPOINTMENT_PAYMENT_TYPES.includes('subscription'), true);
});
