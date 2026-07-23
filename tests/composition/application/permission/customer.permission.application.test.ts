import assert from 'node:assert/strict';
import test from 'node:test';
import { createCustomerPermissionApplication } from '../../../../src/composition/application/permission/customer.permission.application.ts';
import { permissionApplicationInput } from './permission.application.support.ts';

test('compõe a aplicação protegida de customer', () => {
  const input = permissionApplicationInput();
  const application = createCustomerPermissionApplication({
    executionContext: input.executionContext,
    auditRepository: input.repositories.audits,
    customerRepository: input.repositories.customers,
    permissionContext: input.membership,
  });
  assert.equal(typeof application.anonymize, 'function');
});
