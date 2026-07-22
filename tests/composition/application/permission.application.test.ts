import test from 'node:test';
import assert from 'node:assert/strict';
import { createPermissionApplication } from '../../../src/composition/application/permission.application.ts';
import { ExecutionContext } from '../../../src/core/context/execution.context.ts';
import type { Membership } from '../../../src/core/entities/membership/membership.ts';
import { ActorRepositoryMock } from '../../../src/mocks/actor.repository.ts';
import { AuditRepositoryMock } from '../../../src/mocks/audit.repository.ts';
import { DatabaseMock } from '../../../src/mocks/database.ts';
import { LoggerMock } from '../../../src/mocks/logger.ts';
import { MembershipRepositoryMock } from '../../../src/mocks/membership.repository.ts';
import { OrganizationRepositoryMock } from '../../../src/mocks/organization.repository.ts';
import { PasswordHashMock } from '../../../src/mocks/password.hash.ts';
import {
  PolicyActor,
  PolicyOrganization,
  PolicyOrganizationSlug,
  type Status,
} from '../../../src/mocks/status.ts';

type Statuses = {
  actors: Status;
  organizations: Status;
  memberships: Status;
};

type Extras = {
  actors: unknown;
  organizations: unknown;
  memberships: unknown;
};

function membershipFixture(): Membership<Status> {
  return {
    id: 'membership-1',
    createdAt: new Date('2026-07-21T00:00:00.000Z'),
    updatedAt: new Date('2026-07-21T00:00:00.000Z'),
    status: 'active',
    organizationId: 'organization-1',
    actorId: 'actor-1',
    role: 'owner',
    permissions: [],
  };
}

test('Monta somente a superfície protegida da aplicação', () => {
  const application = createPermissionApplication<Statuses, Extras>({
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    membership: membershipFixture(),
    policy: {
      actor: {
        actorStatusPolicy: new PolicyActor(),
      },
      organization: {
        organizationStatusPolicy: new PolicyOrganization(),
        organizationSlugPolicy: new PolicyOrganizationSlug(),
      },
    },
    repositories: {
      actors: new ActorRepositoryMock(),
      audits: new AuditRepositoryMock(),
      memberships: new MembershipRepositoryMock(),
      organizations: new OrganizationRepositoryMock(),
    },
  });

  assert.equal(typeof application.actor.create, 'function');
  assert.equal(typeof application.organization.create, 'function');
  assert.equal(typeof application.membership.create, 'function');
  assert.equal('validationQuery' in application.actor, false);
  assert.equal('validationQuery' in application.organization, false);
  assert.equal(Object.isFrozen(application), true);
  assert.equal(Object.isFrozen(application.actor), true);
  assert.equal(Object.isFrozen(application.organization), true);
  assert.equal(Object.isFrozen(application.membership), true);
});
