import assert from 'node:assert/strict';
import test from 'node:test';
import { CreateAppointmentUseCase } from '../../../../../src/core/entities/appointment/application/appointment.create.ts';
import { APPOINTMENT_ERROR_CODE } from '../../../../../src/core/entities/appointment/domain/appointment.errors.ts';
import { appointment, setup } from './appointment.support.ts';

test('cria appointment, calcula fim e consome a subscription selecionada', async () => {
  const context = setup();
  const useCase = new CreateAppointmentUseCase(
    context.executionContext,
    context.appointmentRepository,
    context.customerRepository,
    context.serviceRepository,
    context.subscriptionRepository,
    context.paymentPolicy,
    context.appointmentStatusPolicy,
  );
  const {
    datetimeFinal: _ignored,
    paymentProvider: _provider,
    ...input
  } = appointment;

  await useCase.execute(input);

  assert.equal(
    context.appointmentRepository.appointments[0]?.datetimeFinal.toISOString(),
    appointment.datetimeFinal.toISOString(),
  );
  assert.equal(
    context.appointmentRepository.appointments[0]?.paymentProvider,
    'local',
  );
  assert.equal(
    context.subscriptionRepository.subscriptions[0]?.usedServices[0]?.used,
    1,
  );
});

test('exige subscriptionId somente para atendimento pelo plano', async () => {
  const context = setup();
  const useCase = new CreateAppointmentUseCase(
    context.executionContext,
    context.appointmentRepository,
    context.customerRepository,
    context.serviceRepository,
    context.subscriptionRepository,
    context.paymentPolicy,
    context.appointmentStatusPolicy,
  );
  const { subscriptionId: _ignored, ...withoutSubscription } = appointment;
  await assert.rejects(
    useCase.execute(withoutSubscription),
    { code: APPOINTMENT_ERROR_CODE.SUBSCRIPTION_REQUIRED },
  );
  await assert.rejects(
    useCase.execute({
      ...appointment,
      isPlanService: false,
      paymentType: 'cash',
    }),
    { code: APPOINTMENT_ERROR_CODE.SUBSCRIPTION_FORBIDDEN },
  );
});

test('mantém o appointment quando a integração de calendário falha', async () => {
  const context = setup();
  context.executionContext.calendarIntegrationPort = {
    upsertAppointment: async () => { throw new Error('calendar unavailable'); },
    cancelAppointment: async () => {},
  };
  const useCase = new CreateAppointmentUseCase(
    context.executionContext,
    context.appointmentRepository,
    context.customerRepository,
    context.serviceRepository,
    context.subscriptionRepository,
    context.paymentPolicy,
    context.appointmentStatusPolicy,
  );

  await assert.doesNotReject(useCase.execute(appointment));

  assert.equal(context.appointmentRepository.appointments.length, 1);
});
