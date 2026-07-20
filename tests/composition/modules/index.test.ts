import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ActorComposition,
  AuthComposition,
  MembershipComposition,
  OrganizationComposition,
} from '../../../src/composition/modules/index.ts';

test('Exporta as composições dos módulos', () => {
  assert.equal(typeof ActorComposition, 'function');
  assert.equal(typeof AuthComposition, 'function');
  assert.equal(typeof MembershipComposition, 'function');
  assert.equal(typeof OrganizationComposition, 'function');
});
