import test from 'node:test';
import assert from 'node:assert/strict';
import { PasswordHashMock } from '../../src/mocks/password.hash.ts';

test('Gera o hash da senha', async () => {
  const passwordHash = new PasswordHashMock();

  assert.equal(await passwordHash.hash('secret'), 'hashed-secret');
});

test('Valida uma senha correspondente ao hash', async () => {
  const passwordHash = new PasswordHashMock();

  assert.equal(await passwordHash.verify('secret', 'hashed-secret'), true);
});

test('Rejeita uma senha que não corresponde ao hash', async () => {
  const passwordHash = new PasswordHashMock();

  assert.equal(await passwordHash.verify('invalid', 'hashed-secret'), false);
});