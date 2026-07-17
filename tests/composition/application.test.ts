import test from 'node:test';
import assert from 'node:assert/strict';
import { Application } from '../../src/composition/application.ts';
import { AppContext } from '../../src/core/context/app.context.ts';
import type { Membership } from '../../src/core/entities/membership/membership.ts';
import { CNPJ } from '../../src/core/entities/organization/domain/cnpj.ts';
import type { Organization } from '../../src/core/entities/organization/organization.ts';
import { Email } from '../../src/core/entities/user/domain/email.ts';
import { Telephone } from '../../src/core/entities/user/domain/telephone.ts';
import { DatabaseMock } from '../../src/mocks/database.ts';
import { LoggerMock } from '../../src/mocks/logger.ts';
import { MembershipRepositoryMock } from '../../src/mocks/membership.repository.ts';
import { OrganizationRepositoryMock } from '../../src/mocks/organization.repository.ts';
import { PolicyOrganization, PolicyUser, type Status } from '../../src/mocks/status.ts';
import { UserRepositoryMock } from '../../src/mocks/user.repository.ts';
import type { User } from '../../src/core/entities/user/user.ts';
import { PasswordHashMock } from '../../src/mocks/password.hash.ts';
import type { TokenPort } from '../../src/core/ports/token.port.ts';


test('Compõe o contexto e os casos de uso da aplicação', async () => {
  const database = new DatabaseMock();
  const logger = new LoggerMock();
  const UsersRepositories = new UserRepositoryMock();
  const OrganizationsRepositories = new OrganizationRepositoryMock();
  const MembershipsRepositories = new MembershipRepositoryMock();

  type ApplicationStatuses = {
    users: Status;
    organizations: Status;
    memberships: Status;
  };

  type RepositoriesExtra = {
    users: unknown;
    organizations: unknown;
    memberships: unknown;
  };

  const tokenPort: TokenPort<string> = {
    payload: undefined,
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
      users: UsersRepositories,
      organizations: OrganizationsRepositories,
      memberships: MembershipsRepositories,
    },
    authentication: {
      tokenPort: tokenPort,
    },
    policy: {
      user: {
        userStatusPolicy: new PolicyUser()
      },
      organization: {
        organizationStatusPolicy: new PolicyOrganization()
      },
    },
  });

  assert.ok(application.context instanceof AppContext);
  assert.equal(typeof application.auth.authenticate, 'function');
  assert.ok(application.user.create instanceof Function);
  assert.equal(typeof application.organization.validationQuery.findById, 'function');
  assert.equal(typeof application.membership.create, 'function');

  const user: User<ApplicationStatuses['users']> = {
    id: 'user-1',
    createdAt: new Date('2026-07-13T00:00:00.000Z'),
    updatedAt: new Date('2026-07-13T00:00:00.000Z'),
    status: "active" as Status,
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
    passwordHash: 'hashed-password',
    emailVerified: true,
  };

  await application.user.create(user);

  const token = await application.auth.authenticate({
    authenticated: {
      email: user.email.value,
      password: 'password',
      organizationId: 'organization-1',
    },
    payload: { sub: user.id },
    config: { expiresIn: '1h' },
  });

  assert.equal(token, 'generated-token');

  const organization: Organization<ApplicationStatuses['organizations']> = {
    id: 'organization-1',
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    updatedAt: new Date('2026-07-16T00:00:00.000Z'),
    status: 'active',
    name: 'Maumenvi',
    cnpj: new CNPJ('90.021.382/0001-22'),
    ownerUserId: user.id,
  };
  await application.organization.create(organization);

  const membership: Membership<ApplicationStatuses['memberships']> = {
    id: 'membership-1',
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    updatedAt: new Date('2026-07-16T00:00:00.000Z'),
    status: 'active',
    organizationId: organization.id,
    userId: user.id,
    roleId: 'role-1',
  };
  await application.membership.create(membership);

  assert.deepEqual(UsersRepositories.users, [user]);
  assert.deepEqual(OrganizationsRepositories.organizations, [organization]);
  assert.deepEqual(MembershipsRepositories.memberships, [membership]);
  assert.equal(database.commited, 4);
});
