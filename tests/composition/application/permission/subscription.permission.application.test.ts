import assert from 'node:assert/strict';
import test from 'node:test';
import { createSubscriptionPermissionApplication } from '../../../../src/composition/application/permission/subscription.permission.application.ts';
import { permissionApplicationInput } from './permission.application.support.ts';

test('compõe a aplicação protegida de subscription', () => {
  const input = permissionApplicationInput();
  const application = createSubscriptionPermissionApplication({
    executionContext: input.executionContext,
    auditRepository: input.repositories.audits,
    subscriptionRepository: input.repositories.subscriptions,
    customerRepository: input.repositories.customers,
    planRepository: input.repositories.plans,
    permissionContext: input.membership,
  });
  assert.equal(typeof application.renew, 'function');
});
