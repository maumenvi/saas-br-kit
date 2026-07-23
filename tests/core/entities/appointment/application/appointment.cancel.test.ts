import assert from 'node:assert/strict';
import test from 'node:test';
import { CancelAppointmentByActorUseCase } from '../../../../../src/core/entities/appointment/application/appointment.cancel.ts';
import { appointment, setup, subscription } from './appointment.support.ts';

test('cancela pelo actor e devolve consumo da subscription', async () => {
  const context = setup();
  context.appointmentRepository.appointments.push(appointment);
  context.subscriptionRepository.subscriptions[0] = {
    ...subscription,
    usedServices: [{ serviceId: 'service-1', quantity: 2, used: 1 }],
  };
  const useCase = new CancelAppointmentByActorUseCase(
    context.executionContext,
    context.appointmentRepository,
    context.customerRepository,
    context.serviceRepository,
    context.subscriptionRepository,
    context.paymentPolicy,
    context.appointmentStatusPolicy,
  );

  await useCase.execute({
    appointmentId: appointment.id,
    organizationId: appointment.organizationId,
  });

  assert.equal(context.appointmentRepository.appointments[0]?.status, 'inactive');
  assert.equal(
    context.subscriptionRepository.subscriptions[0]?.usedServices[0]?.used,
    0,
  );
});
