import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { ChangeAppointmentStatusUseCase } from '../../../../../src/core/entities/appointment/application/appointment.change.status.ts';
import type { AppointmentRepositoryPort } from '../../../../../src/core/entities/appointment/appointment.repositories.ts';
import type { Appointment } from '../../../../../src/core/entities/appointment/appointment.ts';

test('ChangeAppointmentStatusUseCase delega a operação ao repository', async () => {
  const appointment = { id: 'appointment-1', status: 'active' } as Appointment<'active'>;
  let received: Appointment<'active'> | undefined;
  const repository = {
    changeStatus: async (value: Appointment<'active'>) => {
      received = value;
      
    },
  } as unknown as AppointmentRepositoryPort<'active'>;
  const executionContext = {
    databaseProvider: {
      run: async (callback: (transaction: unknown) => Promise<unknown>) => callback(undefined),
    },
  } as ExecutionContext;
  const useCase = new ChangeAppointmentStatusUseCase(
    executionContext,
    repository,
    {
      isCancelled: () => false,
      cancelledByCustomerStatus: 'active',
      cancelledByActorStatus: 'active',
    },
  );

  await useCase.changeStatus(appointment);

  assert.equal(received, appointment);
  
});
