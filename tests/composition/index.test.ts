import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ActorComposition,
  Application,
  AuthComposition,
  MembershipComposition,
  OrganizationComposition,
  TenantComposition,
  type ActorPermissionApplication,
  type AuthApplication,
  type MembershipPermissionApplication,
  type OrganizationPermissionApplication,
  type PermissionApplication,
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

  const actor = undefined as ActorPermissionApplication<string> | undefined;
  const auth = undefined as AuthApplication<string> | undefined;
  const membership = undefined as
    | MembershipPermissionApplication<string>
    | undefined;
  const organization = undefined as
    | OrganizationPermissionApplication<string>
    | undefined;
  const application = undefined as
    | PermissionApplication<{
      actors: string;
      organizations: string;
      memberships: string;
    }>
    | undefined;

  void actor;
  void auth;
  void membership;
  void organization;
  void application;
});
