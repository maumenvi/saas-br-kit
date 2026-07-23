import test from 'node:test';
import assert from 'node:assert/strict';
import { DomainError } from '../../../../../src/core/shared/domain/domain.error.ts';
import { ActorErrors, ACTOR_ERROR_CODE } from '../../../../../src/core/entities/actor/domain/actor.errors.ts';

test('Cria erro de actor não encontrado', () => {
  const error = ActorErrors.notFound('actor-1');

  assert.ok(error instanceof DomainError);
  assert.equal(error.code, ACTOR_ERROR_CODE.ACTOR_NOT_FOUND);
  assert.equal(error.target, 'src/core/entities/actor/domain/actor.ts');
  assert.match(error.message, /actor-1/);
});

test('Cria erro de actor já existente', () => {
  const error = ActorErrors.alreadyExists('marco@example.com');

  assert.equal(error.code, ACTOR_ERROR_CODE.ACTOR_ALREADY_EXISTS);
  assert.match(error.message, /marco@example\.com/);
});

test('Cria erro de e-mail inválido', () => {
  const error = ActorErrors.invalidEmail('invalid-email');

  assert.equal(error.code, ACTOR_ERROR_CODE.ACTOR_INVALID_EMAIL);
  assert.match(error.message, /invalid-email/);
});

test('Cria erro de telefone inválido', () => {
  const error = ActorErrors.invalidPhone('invalid-phone');

  assert.equal(error.code, ACTOR_ERROR_CODE.ACTOR_INVALID_PHONE);
  assert.match(error.message, /invalid-phone/);
});

test('Cria erros para notificações de contato indisponíveis', () => {
  assert.equal(
    ActorErrors.notificationRequiresUser('actor-1').code,
    ACTOR_ERROR_CODE.ACTOR_NOTIFICATION_REQUIRES_USER,
  );
  assert.equal(
    ActorErrors.emailProviderNotConfigured().code,
    ACTOR_ERROR_CODE.ACTOR_EMAIL_PROVIDER_NOT_CONFIGURED,
  );
  assert.equal(
    ActorErrors.telephoneProviderNotConfigured().code,
    ACTOR_ERROR_CODE.ACTOR_TELEPHONE_PROVIDER_NOT_CONFIGURED,
  );
});
