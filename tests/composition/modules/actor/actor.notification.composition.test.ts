import assert from 'node:assert/strict';
import test from 'node:test';
import {
  composeActorSendEmailConfirmation,
  composeActorSendTelephoneConfirmation,
  composeActorSendOrganizationInvitationEmail,
  composeActorSendOrganizationWelcomeEmail,
} from '../../../../src/composition/modules/actor/actor.notification.composition.ts';
import { ExecutionContext } from '../../../../src/core/context/execution.context.ts';
import type { PermissionContext } from '../../../../src/core/access-control/permission.intercept.ts';
import type {
  SendEmailInput,
  SendEmailPort,
} from '../../../../src/core/ports/send.email.port.ts';
import type {
  SendTelephoneMessageInput,
  SendTelefoneMessagePort,
} from '../../../../src/core/ports/send.telefone.message.port.ts';
import { ActorRepositoryMock } from '../../../../src/mocks/actor.repository.ts';
import { AuditRepositoryMock } from '../../../../src/mocks/audit.repository.ts';
import { DatabaseMock } from '../../../../src/mocks/database.ts';
import { IdempotencyMock } from '../../../../src/mocks/idempotency.ts';
import { LoggerMock } from '../../../../src/mocks/logger.ts';
import { PasswordHashMock } from '../../../../src/mocks/password.hash.ts';
import { actorFixture } from './actor.composition.support.ts';
import { verificationConfigMock } from '../../../../src/mocks/verification.credential.ts';
import { VerificationRepositoryMock } from '../../../../src/mocks/verification.repository.ts';

const delivery = {
  verificationId: 'verification-1',
  credential: '123456',
  expiresAt: new Date('2026-07-22T12:15:00.000Z'),
};

test('Monta envios opcionais sem aplicar idempotência aos reenvios', async () => {
  const emails: SendEmailInput[] = [];
  const telephoneMessages: SendTelephoneMessageInput[] = [];
  const emailProvider: SendEmailPort = {
    async sendEmail(input) {
      emails.push(input);
    },
  };
  const telephoneProvider: SendTelefoneMessagePort = {
    async sendMessage(input) {
      telephoneMessages.push(input);
    },
  };
  const idempotencyProvider = new IdempotencyMock();
  const actors = new ActorRepositoryMock();
  const actor = actorFixture();
  await actors.save(actor);
  const permissionContext: PermissionContext = {
    id: 'membership-1',
    actorId: actor.id,
    organizationId: 'organization-1',
    permissions: [
      'organization:create',
      'membership:create',
      'actor:update',
    ].map((permission) => ({
      membershipId: 'membership-1',
      permission: permission as PermissionContext['permissions'][number]['permission'],
      effect: 'allow',
    })),
  };
  const input = {
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
      sendEmailPort: emailProvider,
      sendTelefoneMessagePort: telephoneProvider,
      idempotencyProvider,
    }),
    actorRepository: actors,
    verificationRepository: new VerificationRepositoryMock(),
    verification: verificationConfigMock(),
    auditRepository: new AuditRepositoryMock(),
    policy: {
      actorStatusPolicy: {
        isEnabled: () => true,
      },
    },
    permissionContext,
  };

  await composeActorSendOrganizationWelcomeEmail(input)({
    actorId: actor.id,
    organizationId: 'organization-1',
  });
  await composeActorSendOrganizationInvitationEmail(input)({
    actorId: actor.id,
    organizationId: 'organization-1',
    ...delivery,
  });
  await composeActorSendEmailConfirmation(input)({ actorId: actor.id, ...delivery });
  await composeActorSendEmailConfirmation(input)({ actorId: actor.id, ...delivery });
  await composeActorSendTelephoneConfirmation(input)({ actorId: actor.id, ...delivery });

  assert.deepEqual(
    emails.map(({ type }) => type),
    [
      'ORGANIZATION_WELCOME',
      'ORGANIZATION_INVITATION',
      'EMAIL_CONFIRMATION',
      'EMAIL_CONFIRMATION',
    ],
  );
  assert.deepEqual(
    telephoneMessages.map(({ type }) => type),
    ['TELEPHONE_CONFIRMATION'],
  );
  assert.deepEqual(idempotencyProvider.actions, []);
});

test('Aplica a permissão correspondente antes de enviar confirmação', async () => {
  const actors = new ActorRepositoryMock();
  const actor = actorFixture();
  await actors.save(actor);
  let sent = 0;
  const handler = composeActorSendEmailConfirmation({
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
      sendEmailPort: {
        async sendEmail() {
          sent += 1;
        },
      },
    }),
    actorRepository: actors,
    verificationRepository: new VerificationRepositoryMock(),
    verification: verificationConfigMock(),
    auditRepository: new AuditRepositoryMock(),
    policy: {
      actorStatusPolicy: {
        isEnabled: () => true,
      },
    },
    permissionContext: {
      id: 'membership-1',
      actorId: actor.id,
      organizationId: 'organization-1',
      permissions: [],
    },
  });

  await assert.rejects(
    handler({ actorId: actor.id, ...delivery }),
    { code: 'ACCESS_CONTROL_PERMISSION_DENIED' },
  );
  assert.equal(sent, 0);
});
