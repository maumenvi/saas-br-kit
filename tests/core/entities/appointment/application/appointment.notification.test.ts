import assert from 'node:assert/strict';
import test from 'node:test';
import { AppointmentNotificationUseCase } from '../../../../../src/core/entities/appointment/application/appointment.notification.ts';
import type { SendEmailInput } from '../../../../../src/core/ports/send.email.port.ts';
import { appointment, setup } from './appointment.support.ts';
import { VerificationRepositoryMock } from '../../../../../src/mocks/verification.repository.ts';
import { verificationConfigMock } from '../../../../../src/mocks/verification.credential.ts';
import { RequestAppointmentResponseVerificationUseCase } from '../../../../../src/core/entities/appointment/application/appointment.response.request.ts';

test('envia os dados do appointment sem definir o corpo no Core', async () => {
  const context = setup();
  context.appointmentRepository.appointments.push(appointment);
  let received: SendEmailInput | undefined;
  context.executionContext.sendEmailPort = {
    sendEmail: async input => { received = input; },
  };
  const useCase = new AppointmentNotificationUseCase(
    context.executionContext,
    context.appointmentRepository,
    context.customerRepository,
    new VerificationRepositoryMock(),
    verificationConfigMock(),
  );

  await useCase.sendEmail({
    appointmentId: appointment.id,
    organizationId: appointment.organizationId,
  });

  assert.equal(received?.type, 'APPOINTMENT_NOTIFICATION');
  assert.equal(received?.appointmentId, appointment.id);
});

test('envia a mesma chave vinculada ao appointment', async () => {
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
  let received: SendEmailInput | undefined;
  context.executionContext.sendEmailPort = {
    sendEmail: async input => { received = input; },
  };
  const notification = new AppointmentNotificationUseCase(
    context.executionContext,
    context.appointmentRepository,
    context.customerRepository,
    verificationRepository,
    verification,
  );

  await notification.sendResponseEmail({
    appointmentId: appointment.id,
    organizationId: appointment.organizationId,
    ...issued,
  });

  assert.equal(received?.type, 'APPOINTMENT_RESPONSE');
  assert.equal(received?.verificationId, issued.verificationId);
});
