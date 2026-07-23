import assert from 'node:assert/strict';
import test from 'node:test';
import { RequestAppointmentResponseVerificationUseCase } from '../../../../../src/core/entities/appointment/application/appointment.response.request.ts';
import { verificationConfigMock } from '../../../../../src/mocks/verification.credential.ts';
import { VerificationRepositoryMock } from '../../../../../src/mocks/verification.repository.ts';
import { appointment, setup } from './appointment.support.ts';

test('cria chave com expiração duas horas antes do appointment', async () => {
  const context = setup();
  context.appointmentRepository.appointments.push(appointment);
  const verificationRepository = new VerificationRepositoryMock();
  const useCase = new RequestAppointmentResponseVerificationUseCase({
    executionContext: context.executionContext,
    appointmentRepository: context.appointmentRepository,
    appointmentStatusPolicy: context.appointmentStatusPolicy,
    verificationRepository,
    verification: verificationConfigMock(),
  });

  const output = await useCase.execute({
    appointmentId: appointment.id,
    organizationId: appointment.organizationId,
  });

  assert.equal(
    output.expiresAt.toISOString(),
    '2026-07-24T10:00:00.000Z',
  );
  assert.equal(verificationRepository.verifications[0]?.actorId, null);
});
