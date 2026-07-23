import assert from 'node:assert/strict';
import test from 'node:test';
import { AppointmentSchedulingService } from '../../../../../src/core/entities/appointment/application/appointment.scheduling.ts';
import { APPOINTMENT_ERROR_CODE } from '../../../../../src/core/entities/appointment/domain/appointment.errors.ts';
import { appointment, setup } from './appointment.support.ts';

test('rejeita sobreposição e ignora registros cancelados', async () => {
  const context = setup();
  const scheduling = new AppointmentSchedulingService({
    appointmentRepository: context.appointmentRepository,
    customerRepository: context.customerRepository,
    serviceRepository: context.serviceRepository,
    subscriptionRepository: context.subscriptionRepository,
    subscriptionPaymentStatusPolicy: context.paymentPolicy,
    appointmentStatusPolicy: context.appointmentStatusPolicy,
  });
  context.appointmentRepository.appointments.push(appointment);
  await assert.rejects(
    scheduling.prepare(appointment, context.executionContext.clock!()),
    { code: APPOINTMENT_ERROR_CODE.DATETIME_UNAVAILABLE },
  );
  context.appointmentRepository.appointments[0] = {
    ...appointment,
    status: 'inactive',
  };
  await assert.doesNotReject(
    scheduling.prepare(appointment, context.executionContext.clock!()),
  );
});
