import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DatabaseMock,
  LoggerMock,
  OrganizationRepositoryMock,
  UserRepositoryMock,
} from '../../src/mocks/index.ts';

test('Exporta todos os mocks públicos', () => {
  assert.equal(typeof DatabaseMock, 'function');
  assert.equal(typeof LoggerMock, 'function');
  assert.equal(typeof OrganizationRepositoryMock, 'function');
  assert.equal(typeof UserRepositoryMock, 'function');
});
