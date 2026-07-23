import assert from 'node:assert/strict';
import test from 'node:test';
import { createServicePermissionApplication } from '../../../../src/composition/application/permission/service.permission.application.ts';
import { permissionApplicationInput } from './permission.application.support.ts';
import { ORGANIZATION_SCOPE_ERROR_CODE } from '../../../../src/core/access-control/organization.scope.ts';

test('compõe a aplicação protegida de service', () => {
  const input = permissionApplicationInput();
  const application = createServicePermissionApplication({
    executionContext: input.executionContext,
    auditRepository: input.repositories.audits,
    serviceRepository: input.repositories.services,
    permissionContext: input.membership,
  });
  assert.equal(typeof application.create, 'function');
  assert.equal(Object.isFrozen(application), true);
});

test('impede que membership acesse services de outro tenant', async () => {
  const input = permissionApplicationInput();
  const permissionContext = {
    ...input.membership,
    permissions: [{
      id: 'permission-1',
      membershipId: input.membership.id,
      permission: 'service:find' as const,
      effect: 'allow' as const,
      createdAt: new Date(),
      createdByActorId: input.membership.actorId,
    }],
  };
  const application = createServicePermissionApplication({
    executionContext: input.executionContext,
    auditRepository: input.repositories.audits,
    serviceRepository: input.repositories.services,
    permissionContext,
  });

  await assert.rejects(
    application.findByOrganizationId('organization-2'),
    { code: ORGANIZATION_SCOPE_ERROR_CODE.DENIED },
  );
});
