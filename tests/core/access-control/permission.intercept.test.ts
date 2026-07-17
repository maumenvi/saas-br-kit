import assert from 'node:assert/strict';
import test from 'node:test';
import { PermissionIntercept } from '../../../src/core/access-control/permission.intercept.ts';

test('Encaminha o input para o próximo handler', async () => {
  const input = { organizationId: 'organization-1' };
  const interceptor = new PermissionIntercept('organization:find');

  const output = await interceptor.intercept(input, async (received) => {
    assert.equal(received, input);
    return 'authorized';
  });

  assert.equal(output, 'authorized');
});
