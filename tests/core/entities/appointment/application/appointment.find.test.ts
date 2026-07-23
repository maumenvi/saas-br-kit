import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { FindAppointmentByIdUseCase } from '../../../../../src/core/entities/appointment/application/appointment.find.ts';
import type { AppointmentRepositoryPort } from '../../../../../src/core/entities/appointment/appointment.repositories.ts';
import type { Appointment } from '../../../../../src/core/entities/appointment/appointment.ts';

test('FindAppointmentByIdUseCase delega a operação ao repository', async () => {
  const appointment = {
    id: 'appointment-1',
    status: 'active',
    organizationId: 'organization-1',
  } as Appointment<'active'>;
  let received: string | undefined;
  const repository = {
    findById: async (value: string) => {
      received = value;
      return appointment;
    },
  } as unknown as AppointmentRepositoryPort<'active'>;
  const executionContext = {
    databaseProvider: {
      run: async (callback: (transaction: unknown) => Promise<unknown>) => callback(undefined),
    },
  } as ExecutionContext;
  const useCase = new FindAppointmentByIdUseCase(executionContext, repository);

  const result = await useCase.findById('organization-1', appointment.id);

  assert.equal(received, appointment.id);
  assert.equal(result, appointment);
});
