import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACCESS_CONTROL_ERROR_CODE,
  ACTOR_PERMISSION_KEYS,
  MEMBERSHIP_PERMISSION_KEYS,
  ORGANIZATION_PERMISSION_KEYS,
  SERVICE_PERMISSION_KEYS,
  CUSTOMER_PERMISSION_KEYS,
  PLAN_PERMISSION_KEYS,
  SUBSCRIPTION_PERMISSION_KEYS,
  APPOINTMENT_PERMISSION_KEYS,
  PERMISSION_KEYS,
  PermissionIntercept,
} from '../../../src/core/access-control/index.ts';

test('Exporta a superfície pública de controle de acesso', () => {
  assert.equal(PERMISSION_KEYS.length, 33);
  assert.equal(ORGANIZATION_PERMISSION_KEYS.length, 4);
  assert.equal(MEMBERSHIP_PERMISSION_KEYS.length, 4);
  assert.equal(ACTOR_PERMISSION_KEYS.length, 4);
  assert.equal(SERVICE_PERMISSION_KEYS.length, 4);
  assert.equal(CUSTOMER_PERMISSION_KEYS.length, 4);
  assert.equal(PLAN_PERMISSION_KEYS.length, 4);
  assert.equal(SUBSCRIPTION_PERMISSION_KEYS.length, 4);
  assert.equal(APPOINTMENT_PERMISSION_KEYS.length, 5);
  assert.equal(typeof PermissionIntercept, 'function');
  assert.equal(
    ACCESS_CONTROL_ERROR_CODE.PERMISSION_DENIED,
    'ACCESS_CONTROL_PERMISSION_DENIED',
  );
});
