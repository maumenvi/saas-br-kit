import assert from 'node:assert/strict';
import test from 'node:test';
import { RequestAppointmentResponseVerificationUseCase } from '../../../../../src/core/entities/appointment/application/appointment.response.request.ts';
import { RespondAppointmentUseCase } from '../../../../../src/core/entities/appointment/application/appointment.respond.ts';
import { verificationConfigMock } from '../../../../../src/mocks/verification.credential.ts';
import { VerificationRepositoryMock } from '../../../../../src/mocks/verification.repository.ts';
import { appointment, setup, subscription } from './appointment.support.ts';

test('confirma appointment ao validar a chave', async () => {
  const context = setup();
  context.appointmentRepository.appointments.push(appointment);
  const verificationRepository = new VerificationRepositoryMock();
  const verification = verificationConfigMock();
  const request = new RequestAppointmentResponseVerificationUseCase({
    executionContext: context.executionContext,
    appointmentRepository: context.appointmentRepository,
    appointmentStatusPolicy: context.appointmentStatusPolicy,
    verificationRepository,
    verification,
  });
  const issued = await request.execute({
    appointmentId: appointment.id,
    organizationId: appointment.organizationId,
  });
  const respond = new RespondAppointmentUseCase({
    executionContext: context.executionContext,
    appointmentRepository: context.appointmentRepository,
    customerRepository: context.customerRepository,
    serviceRepository: context.serviceRepository,
    subscriptionRepository: context.subscriptionRepository,
    subscriptionPaymentStatusPolicy: context.paymentPolicy,
    appointmentStatusPolicy: context.appointmentStatusPolicy,
    verificationRepository,
    verification,
  });

  await respond.execute({
    verificationId: issued.verificationId,
    credential: issued.credential,
    action: 'CONFIRM',
  });

  assert.equal(
    context.appointmentRepository.appointments[0]?.confirmedAt?.toISOString(),
    context.executionContext.clock!().toISOString(),
  );
});

test('cancela pelo customer e devolve o consumo', async () => {
  const context = setup();
  context.appointmentRepository.appointments.push(appointment);
  context.subscriptionRepository.subscriptions[0] = {
    ...subscription,
    usedServices: [{ serviceId: 'service-1', quantity: 2, used: 1 }],
  };
  const verificationRepository = new VerificationRepositoryMock();
  const verification = verificationConfigMock();
  const request = new RequestAppointmentResponseVerificationUseCase({
    executionContext: context.executionContext,
    appointmentRepository: context.appointmentRepository,
    appointmentStatusPolicy: context.appointmentStatusPolicy,
    verificationRepository,
    verification,
  });
  const issued = await request.execute({
    appointmentId: appointment.id,
    organizationId: appointment.organizationId,
  });
  const respond = new RespondAppointmentUseCase({
    executionContext: context.executionContext,
    appointmentRepository: context.appointmentRepository,
    customerRepository: context.customerRepository,
    serviceRepository: context.serviceRepository,
    subscriptionRepository: context.subscriptionRepository,
    subscriptionPaymentStatusPolicy: context.paymentPolicy,
    appointmentStatusPolicy: context.appointmentStatusPolicy,
    verificationRepository,
    verification,
  });

  await respond.execute({
    verificationId: issued.verificationId,
    credential: issued.credential,
    action: 'CANCEL',
  });

  assert.equal(context.appointmentRepository.appointments[0]?.status, 'inactive');
  assert.equal(
    context.subscriptionRepository.subscriptions[0]?.usedServices[0]?.used,
    0,
  );
});
