import assert from 'node:assert/strict';
import test from 'node:test';
import { UpdateAppointmentUseCase } from '../../../../../src/core/entities/appointment/application/appointment.update.ts';
import { appointment, setup } from './appointment.support.ts';

test('atualiza ignorando o próprio horário e recalcula o consumo', async () => {
  const context = setup();
  context.appointmentRepository.appointments.push(appointment);
  context.subscriptionRepository.subscriptions[0] = {
    ...context.subscriptionRepository.subscriptions[0]!,
    usedServices: [{ serviceId: 'service-1', quantity: 2, used: 1 }],
  };
  const useCase = new UpdateAppointmentUseCase(
    context.executionContext,
    context.appointmentRepository,
    context.customerRepository,
    context.serviceRepository,
    context.subscriptionRepository,
    context.paymentPolicy,
    context.appointmentStatusPolicy,
  );

  await useCase.update(appointment);

  assert.equal(context.appointmentRepository.appointments.length, 1);
  assert.equal(
    context.subscriptionRepository.subscriptions[0]?.usedServices[0]?.used,
    1,
  );
});
