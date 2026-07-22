import assert from 'node:assert/strict';
import test from 'node:test';
import { RegistrationComposition } from '../../../../src/composition/modules/registration/registration.composition.ts';
import { ExecutionContext } from '../../../../src/core/context/execution.context.ts';
import { Email } from '../../../../src/core/entities/actor/domain/email.ts';
import { Telephone } from '../../../../src/core/entities/actor/domain/telephone.ts';
import { CNPJ } from '../../../../src/core/entities/organization/domain/cnpj.ts';
import { OrganizationSlug } from '../../../../src/core/entities/organization/domain/organization.slug.ts';
import type { SendEmailInput } from '../../../../src/core/ports/send.email.port.ts';
import type { SendTelephoneMessageInput } from '../../../../src/core/ports/send.telefone.message.port.ts';
import { ActorRepositoryMock } from '../../../../src/mocks/actor.repository.ts';
import { AuditRepositoryMock } from '../../../../src/mocks/audit.repository.ts';
import { DatabaseMock } from '../../../../src/mocks/database.ts';
import { IdempotencyMock } from '../../../../src/mocks/idempotency.ts';
import { LoggerMock } from '../../../../src/mocks/logger.ts';
import { MembershipRepositoryMock } from '../../../../src/mocks/membership.repository.ts';
import { OrganizationRepositoryMock } from '../../../../src/mocks/organization.repository.ts';
import { PasswordHashMock } from '../../../../src/mocks/password.hash.ts';
import { verificationConfigMock } from '../../../../src/mocks/verification.credential.ts';
import { VerificationRepositoryMock } from '../../../../src/mocks/verification.repository.ts';
import {
  PolicyActor,
  PolicyOrganization,
  PolicyOrganizationSlug,
  type Status,
} from '../../../../src/mocks/status.ts';

test('Expõe cadastro público auditado e idempotente sem contexto de permissão', async () => {
  const audits = new AuditRepositoryMock();
  const idempotency = new IdempotencyMock();
  const actors = new ActorRepositoryMock();
  const emails: SendEmailInput[] = [];
  const telephoneMessages: SendTelephoneMessageInput[] = [];
  let id = 0;
  const composition = new RegistrationComposition<Status, Status, Status>({
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
      idempotencyProvider: idempotency,
      sendEmailPort: {
        async sendEmail(input) {
          emails.push(input);
        },
      },
      sendTelefoneMessagePort: {
        async sendMessage(input) {
          telephoneMessages.push(input);
        },
      },
      idGenerator: () => `id-${++id}`,
    }),
    auditRepository: audits,
    actorRepository: actors,
    organizationRepository: new OrganizationRepositoryMock(),
    membershipRepository: new MembershipRepositoryMock(),
    verificationRepository: new VerificationRepositoryMock(),
    verification: verificationConfigMock(),
    policy: {
      actorStatusPolicy: new PolicyActor(),
      organizationStatusPolicy: new PolicyOrganization(),
      organizationSlugPolicy: new PolicyOrganizationSlug(),
    },
  });
  const timestamp = new Date('2026-07-22T12:00:00.000Z');

  const output = await composition.createOrganization({
    user: {
      id: 'actor-1',
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'active',
      name: 'Marco',
      email: new Email('marco@example.com'),
      telephone: new Telephone('+5511999999999'),
      password: 'safe-password',
    },
    organization: {
      id: 'organization-1',
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'active',
      name: 'Maumenvi',
      slug: new OrganizationSlug('maumenvi'),
      cnpj: new CNPJ('90.021.382/0001-22'),
    },
    membership: {
      id: 'membership-1',
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'active',
    },
  });

  await composition.sendOrganizationWelcomeEmail({
    actorId: output.actorId,
    organizationId: output.organizationId,
  });
  const firstEmail = await composition.requestEmailConfirmation({ actorId: output.actorId });
  await composition.sendEmailConfirmation({
    actorId: output.actorId,
    verificationId: firstEmail.verificationId,
    credential: firstEmail.credential,
    expiresAt: firstEmail.expiresAt,
  });
  const secondEmail = await composition.requestEmailConfirmation({ actorId: output.actorId });
  await composition.sendEmailConfirmation({
    actorId: output.actorId,
    verificationId: secondEmail.verificationId,
    credential: secondEmail.credential,
    expiresAt: secondEmail.expiresAt,
  });
  const firstTelephone = await composition.requestTelephoneConfirmation({ actorId: output.actorId });
  await composition.sendTelephoneConfirmation({
    actorId: output.actorId,
    verificationId: firstTelephone.verificationId,
    credential: firstTelephone.credential,
    expiresAt: firstTelephone.expiresAt,
  });
  const secondTelephone = await composition.requestTelephoneConfirmation({ actorId: output.actorId });
  await composition.sendTelephoneConfirmation({
    actorId: output.actorId,
    verificationId: secondTelephone.verificationId,
    credential: secondTelephone.credential,
    expiresAt: secondTelephone.expiresAt,
  });

  assert.equal(typeof composition.createOrganization, 'function');
  assert.equal(typeof composition.sendOrganizationWelcomeEmail, 'function');
  assert.equal(typeof composition.requestEmailConfirmation, 'function');
  assert.equal(typeof composition.requestTelephoneConfirmation, 'function');
  assert.deepEqual(idempotency.actions, ['registration:create-organization']);
  assert.deepEqual(
    emails.map(({ type }) => type),
    [
      'ORGANIZATION_WELCOME',
      'EMAIL_CONFIRMATION',
      'EMAIL_CONFIRMATION',
    ],
  );
  assert.deepEqual(
    telephoneMessages.map(({ type }) => type),
    ['TELEPHONE_CONFIRMATION', 'TELEPHONE_CONFIRMATION'],
  );
  assert.equal(idempotency.executions[0]?.identity, undefined);
  assert.equal(audits.audits[0]?.action, 'registration:create-organization');
  assert.equal(audits.audits[0]?.actorId, output.actorId);
  assert.equal(audits.audits[0]?.organizationId, output.organizationId);
  assert.equal(audits.audits[0]?.membershipId, output.membershipId);
  assert.equal(
    (audits.audits[0]?.input as { user: { password: string } }).user.password,
    '[REDACTED]',
  );
});
