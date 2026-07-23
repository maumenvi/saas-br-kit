import assert from 'node:assert/strict';
import test from 'node:test';
import { PLAN_PERMISSION_KEYS } from '../../../src/core/access-control/plan.permissions.ts';

test('declara permissões de plan', () => {
  assert.equal(PLAN_PERMISSION_KEYS.includes('plan:find'), true);
});
