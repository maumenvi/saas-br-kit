import assert from 'node:assert/strict';
import test from 'node:test';
import { assertOrganizationScope, ORGANIZATION_SCOPE_ERROR_CODE } from '../../../src/core/access-control/organization.scope.ts';

const context = {
  id: 'membership-1',
  actorId: 'actor-1',
  organizationId: 'organization-1',
  permissions: [],
};

test('nega acesso a outra organização', () => {
  assert.doesNotThrow(() => assertOrganizationScope(context, 'organization-1'));
  assert.throws(
    () => assertOrganizationScope(context, 'organization-2'),
    { code: ORGANIZATION_SCOPE_ERROR_CODE.DENIED },
  );
});
