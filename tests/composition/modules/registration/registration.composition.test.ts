import assert from 'node:assert/strict';
import test from 'node:test';
import { RegistrationComposition } from '../../../../src/composition/modules/registration/registration.composition.ts';
import { ExecutionContext } from '../../../../src/core/context/execution.context.ts';
import { Email } from '../../../../src/core/entities/actor/domain/email.ts';
import { Telephone } from '../../../../src/core/entities/actor/domain/telephone.ts';
import { CNPJ } from '../../../../src/core/entities/organization/domain/cnpj.ts';
import { OrganizationSlug } from '../../../../src/core/entities/organization/domain/organization.slug.ts';
import { ActorRepositoryMock } from '../../../../src/mocks/actor.repository.ts';
import { AuditRepositoryMock } from '../../../../src/mocks/audit.repository.ts';
import { DatabaseMock } from '../../../../src/mocks/database.ts';
import { IdempotencyMock } from '../../../../src/mocks/idempotency.ts';
import { LoggerMock } from '../../../../src/mocks/logger.ts';
import { MembershipRepositoryMock } from '../../../../src/mocks/membership.repository.ts';
import { OrganizationRepositoryMock } from '../../../../src/mocks/organization.repository.ts';
import { PasswordHashMock } from '../../../../src/mocks/password.hash.ts';
import {
  PolicyActor,
  PolicyOrganization,
  PolicyOrganizationSlug,
  type Status,
} from '../../../../src/mocks/status.ts';

test('Expõe cadastro público auditado e idempotente sem contexto de permissão', async () => {
  const audits = new AuditRepositoryMock();
  const idempotency = new IdempotencyMock();
  let id = 0;
  const composition = new RegistrationComposition<Status, Status, Status>({
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
      idempotencyProvider: idempotency,
      idGenerator: () => `id-${++id}`,
    }),
    auditRepository: audits,
    actorRepository: new ActorRepositoryMock(),
    organizationRepository: new OrganizationRepositoryMock(),
    membershipRepository: new MembershipRepositoryMock(),
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

  assert.equal(typeof composition.createOrganization, 'function');
  assert.deepEqual(idempotency.actions, ['registration:create-organization']);
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
