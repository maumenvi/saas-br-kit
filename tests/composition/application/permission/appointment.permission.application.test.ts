import assert from 'node:assert/strict';
import test from 'node:test';
import { createAppointmentPermissionApplication } from '../../../../src/composition/application/permission/appointment.permission.application.ts';
import { permissionApplicationInput } from './permission.application.support.ts';

test('compõe a aplicação protegida de appointment', () => {
  const input = permissionApplicationInput();
  const application = createAppointmentPermissionApplication({
    executionContext: input.executionContext,
    auditRepository: input.repositories.audits,
    appointmentRepository: input.repositories.appointments,
    customerRepository: input.repositories.customers,
    serviceRepository: input.repositories.services,
    subscriptionRepository: input.repositories.subscriptions,
    verificationRepository: input.repositories.verifications,
    subscriptionPaymentStatusPolicy:
      input.policy.subscription.subscriptionPaymentStatusPolicy,
    appointmentStatusPolicy:
      input.policy.appointment.appointmentStatusPolicy,
    verification: input.verification,
    permissionContext: input.membership,
  });
  assert.equal(typeof application.cancel, 'function');
  assert.equal(typeof application.requestResponse, 'function');
});
