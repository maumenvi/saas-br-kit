import test from 'node:test';
import assert from 'node:assert/strict';
import { DomainError } from '../../../../../src/core/shared/domain/domain.error.ts';
import { Email } from '../../../../../src/core/entities/actor/domain/email.ts';


test('Preserva e valida e-mail válido', () => {
  const email = new Email('marco@example.com');

  assert.equal(email.value, 'marco@example.com');
  assert.doesNotThrow(() => email.validate());
});

test('Rejeita e-mail inválido', () => {
  const email = new Email('invalid-email');

  assert.throws(
    () => email.validate(),
    (error) => error instanceof DomainError && error.code === 'ACTOR_INVALID_EMAIL',
  );
});
