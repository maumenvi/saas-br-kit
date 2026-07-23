import assert from 'node:assert/strict';
import test from 'node:test';
import { AppointmentRepositoryMock } from '../../src/mocks/appointment.repository.ts';
import { appointment } from '../core/entities/appointment/application/appointment.support.ts';

test('encontra sobreposição apenas dentro da organização', async () => {
  const repository = new AppointmentRepositoryMock();
  await repository.save(appointment);
  const matches = await repository.findByDatetime(
    'organization-1',
    appointment.datetimeInitial,
    appointment.datetimeFinal,
  );
  assert.deepEqual(matches, [appointment]);
});
