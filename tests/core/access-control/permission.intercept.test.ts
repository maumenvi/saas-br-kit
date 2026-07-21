import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ACCESS_CONTROL_ERROR_CODE,
  PermissionIntercept,
  type PermissionContext,
} from '../../../src/core/access-control/permission.intercept.ts';

function permissionContext(
  permissions: PermissionContext['permissions'],
): PermissionContext {
  return {
    id: 'membership-1',
    actorId: 'actor-1',
    organizationId: 'organization-1',
    permissions,
  };
}

test('Encaminha o input quando o membership permite a operação', async () => {
  const input = { organizationId: 'organization-1' };
  const interceptor = new PermissionIntercept('organization:find', permissionContext([{
    membershipId: 'membership-1',
    permission: 'organization:find',
    effect: 'allow',
  }]));

  const output = await interceptor.intercept(input, async (received) => {
    assert.equal(received, input);
    return 'authorized';
  });

  assert.equal(output, 'authorized');
});

test('Nega por padrão quando a permissão não existe', async () => {
  const interceptor = new PermissionIntercept(
    'organization:find',
    permissionContext([]),
  );
  let called = false;

  await assert.rejects(
    interceptor.intercept({}, async () => {
      called = true;
      return 'unauthorized';
    }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(
        (error as { code?: string }).code,
        ACCESS_CONTROL_ERROR_CODE.PERMISSION_DENIED,
      );
      return true;
    },
  );

  assert.equal(called, false);
});

test('Ignora permissões de outro membership', async () => {
  const interceptor = new PermissionIntercept('organization:find', permissionContext([{
    membershipId: 'membership-2',
    permission: 'organization:find',
    effect: 'allow',
  }]));

  await assert.rejects(
    interceptor.intercept({}, async () => 'unauthorized'),
    { code: ACCESS_CONTROL_ERROR_CODE.PERMISSION_DENIED },
  );
});

test('Deny prevalece sobre allow', async () => {
  const interceptor = new PermissionIntercept('organization:find', permissionContext([
    {
      membershipId: 'membership-1',
      permission: 'organization:find',
      effect: 'allow',
    },
    {
      membershipId: 'membership-1',
      permission: 'organization:find',
      effect: 'deny',
    },
  ]));

  await assert.rejects(
    interceptor.intercept({}, async () => 'unauthorized'),
    { code: ACCESS_CONTROL_ERROR_CODE.PERMISSION_DENIED },
  );
});

test('Usa snapshot das permissões recebido na construção', async () => {
  const permissions: Array<PermissionContext['permissions'][number]> = [];
  const interceptor = new PermissionIntercept(
    'organization:find',
    permissionContext(permissions),
  );

  permissions.push({
    membershipId: 'membership-1',
    permission: 'organization:find',
    effect: 'allow',
  });

  await assert.rejects(
    interceptor.intercept({}, async () => 'unauthorized'),
    { code: ACCESS_CONTROL_ERROR_CODE.PERMISSION_DENIED },
  );
});
