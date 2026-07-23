import assert from 'node:assert/strict';
import test from 'node:test';
import { createAppointmentApplication } from '../../../../src/composition/application/public/appointment.application.ts';
import { permissionApplicationInput } from '../permission/permission.application.support.ts';

test('expõe resposta pública do customer', () => {
  const input = permissionApplicationInput();
  const application = createAppointmentApplication({
    executionContext: input.executionContext,
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
    auditRepository: input.repositories.audits,
  });
  assert.equal(typeof application.respond, 'function');
});
