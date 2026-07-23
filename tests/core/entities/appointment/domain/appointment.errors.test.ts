import assert from 'node:assert/strict';
import test from 'node:test';
import { APPOINTMENT_ERROR_CODE, AppointmentErrors } from '../../../../../src/core/entities/appointment/domain/appointment.errors.ts';

test('cria erros das regras de assinatura', () => {
  assert.equal(
    AppointmentErrors.subscriptionRequired().code,
    APPOINTMENT_ERROR_CODE.SUBSCRIPTION_REQUIRED,
  );
  assert.equal(
    AppointmentErrors.subscriptionForbidden().code,
    APPOINTMENT_ERROR_CODE.SUBSCRIPTION_FORBIDDEN,
  );
});
