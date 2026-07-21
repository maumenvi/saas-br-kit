import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ActorComposition,
  Application,
  AuthComposition,
  MembershipComposition,
  OrganizationComposition,
  TenantComposition,
  pipe,
} from '../../src/composition/index.ts';

test('Exporta a composição pública', () => {
  assert.equal(typeof ActorComposition, 'function');
  assert.equal(typeof Application, 'function');
  assert.equal(typeof AuthComposition, 'function');
  assert.equal(typeof MembershipComposition, 'function');
  assert.equal(typeof OrganizationComposition, 'function');
  assert.equal(typeof TenantComposition, 'function');
  assert.equal(typeof pipe, 'function');
});
