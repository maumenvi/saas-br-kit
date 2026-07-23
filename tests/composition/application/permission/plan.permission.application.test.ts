import assert from 'node:assert/strict';
import test from 'node:test';
import { createPlanPermissionApplication } from '../../../../src/composition/application/permission/plan.permission.application.ts';
import { permissionApplicationInput } from './permission.application.support.ts';

test('compõe a aplicação protegida de plan', () => {
  const input = permissionApplicationInput();
  const application = createPlanPermissionApplication({
    executionContext: input.executionContext,
    auditRepository: input.repositories.audits,
    planRepository: input.repositories.plans,
    serviceRepository: input.repositories.services,
    permissionContext: input.membership,
  });
  assert.equal(typeof application.findByOneOrMoreServices, 'function');
});
