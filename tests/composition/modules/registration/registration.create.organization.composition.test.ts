import assert from 'node:assert/strict';
import test from 'node:test';
import { composeRegistrationCreateOrganization } from '../../../../src/composition/modules/registration/registration.create.organization.composition.ts';
import { ExecutionContext } from '../../../../src/core/context/execution.context.ts';
import { Email } from '../../../../src/core/entities/actor/domain/email.ts';
import { Telephone } from '../../../../src/core/entities/actor/domain/telephone.ts';
import { CNPJ } from '../../../../src/core/entities/organization/domain/cnpj.ts';
import { OrganizationSlug } from '../../../../src/core/entities/organization/domain/organization.slug.ts';
import { ActorRepositoryMock } from '../../../../src/mocks/actor.repository.ts';
import { AuditRepositoryMock } from '../../../../src/mocks/audit.repository.ts';
import { DatabaseMock } from '../../../../src/mocks/database.ts';
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

test('Monta e executa o cadastro público de organização', async () => {
  const actors = new ActorRepositoryMock();
  const organizations = new OrganizationRepositoryMock();
  const memberships = new MembershipRepositoryMock();
  const handler = composeRegistrationCreateOrganization<Status, Status, Status>({
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
      idGenerator: () => crypto.randomUUID(),
    }),
    auditRepository: new AuditRepositoryMock(),
    actorRepository: actors,
    organizationRepository: organizations,
    membershipRepository: memberships,
    verificationRepository: new VerificationRepositoryMock(),
    verification: verificationConfigMock(),
    policy: {
      actorStatusPolicy: new PolicyActor(),
      organizationStatusPolicy: new PolicyOrganization(),
      organizationSlugPolicy: new PolicyOrganizationSlug(),
    },
  });
  const timestamp = new Date('2026-07-22T12:00:00.000Z');

  await handler({
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

  assert.equal(actors.actors.length, 1);
  assert.equal(organizations.organizations.length, 1);
  assert.equal(memberships.memberships.length, 1);
});
