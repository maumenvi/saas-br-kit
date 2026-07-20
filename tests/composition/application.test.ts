import test from 'node:test';
import assert from 'node:assert/strict';
import { Application } from '../../src/composition/application.ts';
import { AppContext } from '../../src/core/context/app.context.ts';
import { Email } from '../../src/core/entities/actor/domain/email.ts';
import { Telephone } from '../../src/core/entities/actor/domain/telephone.ts';
import type { UserActor } from '../../src/core/entities/actor/actor.ts';
import type { Membership } from '../../src/core/entities/membership/membership.ts';
import { CNPJ } from '../../src/core/entities/organization/domain/cnpj.ts';
import type { Organization } from '../../src/core/entities/organization/organization.ts';
import { ActorRepositoryMock } from '../../src/mocks/actor.repository.ts';
import { DatabaseMock } from '../../src/mocks/database.ts';
import { LoggerMock } from '../../src/mocks/logger.ts';
import { MembershipRepositoryMock } from '../../src/mocks/membership.repository.ts';
import { OrganizationRepositoryMock } from '../../src/mocks/organization.repository.ts';
import { PolicyActor, PolicyOrganization, type Status } from '../../src/mocks/status.ts';
import { PasswordHashMock } from '../../src/mocks/password.hash.ts';
import type { TokenPort } from '../../src/core/ports/token.port.ts';


test('Compõe o contexto e os casos de uso da aplicação', async () => {
  const database = new DatabaseMock();
  const logger = new LoggerMock();
  const ActorsRepositories = new ActorRepositoryMock();
  const OrganizationsRepositories = new OrganizationRepositoryMock();
  const MembershipsRepositories = new MembershipRepositoryMock();

  type ApplicationStatuses = {
    actors: Status;
    organizations: Status;
    memberships: Status;
  };

  type RepositoriesExtra = {
    actors: unknown;
    organizations: unknown;
    memberships: unknown;
  };

  const tokenPort: TokenPort<string> = {
    payload: { actorId: 'user-1', organizationId: 'organization-1' },
    config: undefined,
    refreshPayload: undefined,
    refreshConfig: undefined,
    createToken: () => 'generated-token',
    generateToken: async () => 'generated-token',
    verifyToken: async () => ({}),
    generateRefreshToken: async () => 'generated-refresh-token',
    verifyRefreshToken: async () => ({}),
  };

  type tokenOutput = string;
  const application = new Application<
    tokenOutput,
    ApplicationStatuses,
    RepositoriesExtra
  >({
    executionContextInput: {
      databaseProvider: database,
      loggerProvider: logger,
      passwordHashProvider: new PasswordHashMock(),
    },
    repositories: {
      actors: ActorsRepositories,
      organizations: OrganizationsRepositories,
      memberships: MembershipsRepositories,
    },
    authentication: {
      type: 'LOGIN',
      tokenPort: tokenPort,
    },
    policy: {
      actor: {
        actorStatusPolicy: new PolicyActor()
      },
      organization: {
        organizationStatusPolicy: new PolicyOrganization()
      },
    },
  });

  assert.ok(application.context instanceof AppContext);
  assert.equal(typeof application.auth.authenticate, 'function');
  assert.ok(application.actor.create instanceof Function);
  assert.equal(typeof application.organization.validationQuery.findById, 'function');
  assert.equal(typeof application.membership.create, 'function');

  const actor: UserActor<ApplicationStatuses['actors']> = {
    id: 'actor-1',
    createdAt: new Date('2026-07-13T00:00:00.000Z'),
    updatedAt: new Date('2026-07-13T00:00:00.000Z'),
    status: "active" as Status,
    type: 'USER',
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
    passwordHash: 'hashed-password',
    emailVerified: true,
  };

  await application.actor.create(actor);

  const organization: Organization<ApplicationStatuses['organizations']> = {
    id: 'organization-1',
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    updatedAt: new Date('2026-07-16T00:00:00.000Z'),
    status: 'active',
    name: 'Maumenvi',
    cnpj: new CNPJ('90.021.382/0001-22'),
    ownerActorId: actor.id,
  };
  await application.organization.create(organization);

  const membership: Membership<ApplicationStatuses['memberships']> = {
    id: 'membership-1',
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    updatedAt: new Date('2026-07-16T00:00:00.000Z'),
    status: 'active',
    organizationId: organization.id,
    actorId: actor.id,
    role: 'owner',
    permissions: [],
  };
  await application.membership.create(membership);

  const authOutput = await application.auth.authenticate({
    authenticated: {
      email: actor.email.value,
      password: 'password',
      organizationId: organization.id,
    },
    payload: { actorId: actor.id, organizationId: organization.id },
    config: { expiresIn: '1h' },
  });

  assert.deepEqual(authOutput, {
    token: 'generated-token',
    membership,
  });

  assert.deepEqual(ActorsRepositories.actors, [actor]);
  assert.deepEqual(OrganizationsRepositories.organizations, [organization]);
  assert.deepEqual(MembershipsRepositories.memberships, [membership]);
  assert.equal(database.commited, 4);
});
