import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DatabaseMock,
  extras,
  LoggerMock,
  MembershipRepositoryMock,
  OrganizationRepositoryMock,
  PasswordHashMock,
  PolicyOrganization,
  PolicyOrganizationSlug,
  ActorRepositoryMock,
  PolicyActor,
} from '../../src/mocks/index.ts';

test('Exporta todos os mocks públicos', () => {
  assert.equal(typeof DatabaseMock, 'function');
  assert.equal(typeof extras, 'object');
  assert.equal(typeof LoggerMock, 'function');
  assert.equal(typeof MembershipRepositoryMock, 'function');
  assert.equal(typeof OrganizationRepositoryMock, 'function');
  assert.equal(typeof PasswordHashMock, 'function');
  assert.equal(typeof PolicyOrganization, 'function');
  assert.equal(typeof PolicyOrganizationSlug, 'function');
  assert.equal(typeof ActorRepositoryMock, 'function');
  assert.equal(typeof PolicyActor, 'function');
});
