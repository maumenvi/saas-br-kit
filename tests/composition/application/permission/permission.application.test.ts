import assert from 'node:assert/strict';
import test from 'node:test';
import { createPermissionApplication } from '../../../../src/composition/application/permission/permission.application.ts';
import {
  type Extras,
  permissionApplicationInput,
  type Statuses,
} from './permission.application.support.ts';

test('Orquestra os scopes da aplicação protegida', () => {
  const application = createPermissionApplication<Statuses, Extras>(
    permissionApplicationInput(),
  );

  assert.equal(typeof application.actor.create, 'function');
  assert.equal(typeof application.organization.create, 'function');
  assert.equal(typeof application.membership.create, 'function');
  assert.equal('validationQuery' in application.actor, false);
  assert.equal('validationQuery' in application.organization, false);
  assert.equal(Object.isFrozen(application), true);
  assert.equal(Object.isFrozen(application.actor), true);
  assert.equal(Object.isFrozen(application.organization), true);
  assert.equal(Object.isFrozen(application.membership), true);
});
