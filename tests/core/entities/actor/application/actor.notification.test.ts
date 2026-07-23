import assert from 'node:assert/strict';
import test from 'node:test';
import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { ActorNotificationUseCase } from '../../../../../src/core/entities/actor/application/actor.notification.ts';
import type { Actor, UserActor } from '../../../../../src/core/entities/actor/actor.ts';
import { Email } from '../../../../../src/core/entities/actor/domain/email.ts';
import { Telephone } from '../../../../../src/core/entities/actor/domain/telephone.ts';
import type {
  SendEmailInput,
  SendEmailPort,
} from '../../../../../src/core/ports/send.email.port.ts';
import type {
  SendTelephoneMessageInput,
  SendTelefoneMessagePort,
} from '../../../../../src/core/ports/send.telefone.message.port.ts';
import { ActorRepositoryMock } from '../../../../../src/mocks/actor.repository.ts';
import { DatabaseMock } from '../../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../../src/mocks/logger.ts';
import { PasswordHashMock } from '../../../../../src/mocks/password.hash.ts';
import type { Status } from '../../../../../src/mocks/status.ts';

const delivery = {
  verificationId: 'verification-1',
  credential: '123456',
  expiresAt: new Date('2026-07-22T12:15:00.000Z'),
};

class RecordingEmailProvider implements SendEmailPort {
  readonly messages: SendEmailInput[] = [];

  async sendEmail(input: SendEmailInput): Promise<void> {
    this.messages.push(input);
  }
}

class RecordingTelephoneProvider implements SendTelefoneMessagePort {
  readonly messages: SendTelephoneMessageInput[] = [];

  async sendMessage(input: SendTelephoneMessageInput): Promise<void> {
    this.messages.push(input);
  }
}

function userActor(): UserActor<Status> {
  return {
    id: 'actor-1',
    createdAt: new Date('2026-07-22T00:00:00.000Z'),
    updatedAt: new Date('2026-07-22T00:00:00.000Z'),
    status: 'active',
    type: 'USER',
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
    passwordHash: 'hashed-password',
    emailVerified: false,
    telephoneVerified: false,
  };
}

function clientActor(): Actor<Status> {
  return {
    id: 'client-1',
    createdAt: new Date('2026-07-22T00:00:00.000Z'),
    updatedAt: new Date('2026-07-22T00:00:00.000Z'),
    status: 'active',
    type: 'CLIENT',
    name: 'Client',
  };
}

function setup(input: {
  actors?: ActorRepositoryMock;
  emailProvider?: SendEmailPort;
  telephoneProvider?: SendTelefoneMessagePort;
} = {}) {
  const database = new DatabaseMock();
  const actors = input.actors ?? new ActorRepositoryMock();
  const executionContext = new ExecutionContext({
    databaseProvider: database,
    loggerProvider: new LoggerMock(),
    passwordHashProvider: new PasswordHashMock(),
    sendEmailPort: input.emailProvider,
    sendTelefoneMessagePort: input.telephoneProvider,
  });

  return {
    actors,
    database,
    useCase: new ActorNotificationUseCase(executionContext, actors),
  };
}

test('Envia boas-vindas, convite e confirmações para um USER', async () => {
  const emailProvider = new RecordingEmailProvider();
  const telephoneProvider = new RecordingTelephoneProvider();
  const actors = new ActorRepositoryMock();
  await actors.save(userActor());
  const { database, useCase } = setup({
    actors,
    emailProvider,
    telephoneProvider,
  });

  await useCase.sendOrganizationWelcomeEmail({
    actorId: 'actor-1',
    organizationId: 'organization-1',
  });
  await useCase.sendOrganizationInvitationEmail({
    actorId: 'actor-1',
    organizationId: 'organization-2',
    ...delivery,
  });
  await useCase.sendEmailConfirmation({ actorId: 'actor-1', ...delivery });
  await useCase.sendEmailConfirmation({ actorId: 'actor-1', ...delivery });
  await useCase.sendTelephoneConfirmation({ actorId: 'actor-1', ...delivery });

  assert.deepEqual(emailProvider.messages, [
    {
      type: 'ORGANIZATION_WELCOME',
      actorId: 'actor-1',
      organizationId: 'organization-1',
      name: 'Marco',
      to: 'marco@example.com',
    },
    {
      type: 'ORGANIZATION_INVITATION',
      actorId: 'actor-1',
      organizationId: 'organization-2',
      name: 'Marco',
      to: 'marco@example.com',
      ...delivery,
    },
    {
      type: 'EMAIL_CONFIRMATION',
      actorId: 'actor-1',
      name: 'Marco',
      to: 'marco@example.com',
      ...delivery,
    },
    {
      type: 'EMAIL_CONFIRMATION',
      actorId: 'actor-1',
      name: 'Marco',
      to: 'marco@example.com',
      ...delivery,
    },
  ]);
  assert.deepEqual(telephoneProvider.messages, [
    {
      type: 'TELEPHONE_CONFIRMATION',
      actorId: 'actor-1',
      name: 'Marco',
      to: '+5511999999999',
      ...delivery,
    },
  ]);
  assert.equal(database.started, 5);
  assert.equal(database.commited, 5);
  assert.equal(database.rolledback, 0);
});

test('Falha antes de consultar o actor quando o provider não foi configurado', async () => {
  const { database, useCase } = setup();

  await assert.rejects(
    useCase.sendEmailConfirmation({ actorId: 'actor-1', ...delivery }),
    { code: 'ACTOR_EMAIL_PROVIDER_NOT_CONFIGURED' },
  );
  await assert.rejects(
    useCase.sendTelephoneConfirmation({ actorId: 'actor-1', ...delivery }),
    { code: 'ACTOR_TELEPHONE_PROVIDER_NOT_CONFIGURED' },
  );
  assert.equal(database.started, 0);
});

test('Rejeita actor ausente ou que não seja USER antes do envio', async () => {
  const emailProvider = new RecordingEmailProvider();
  const actors = new ActorRepositoryMock();
  await actors.save(clientActor());
  const { database, useCase } = setup({ actors, emailProvider });

  await assert.rejects(
    useCase.sendEmailConfirmation({ actorId: 'missing-actor', ...delivery }),
    { code: 'ACTOR_NOT_FOUND' },
  );
  await assert.rejects(
    useCase.sendEmailConfirmation({ actorId: 'client-1', ...delivery }),
    { code: 'ACTOR_NOTIFICATION_REQUIRES_USER' },
  );
  assert.deepEqual(emailProvider.messages, []);
  assert.equal(database.started, 2);
  assert.equal(database.commited, 0);
  assert.equal(database.rolledback, 2);
});

test('Propaga falha do envio depois de encerrar a consulta ao banco', async () => {
  const actors = new ActorRepositoryMock();
  await actors.save(userActor());
  const failure = new Error('Email provider failed');
  const emailProvider: SendEmailPort = {
    async sendEmail() {
      throw failure;
    },
  };
  const { database, useCase } = setup({ actors, emailProvider });

  await assert.rejects(
    useCase.sendEmailConfirmation({ actorId: 'actor-1', ...delivery }),
    (error) => error === failure,
  );
  assert.equal(database.started, 1);
  assert.equal(database.commited, 1);
  assert.equal(database.rolledback, 0);
});
