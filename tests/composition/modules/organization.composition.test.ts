import test from 'node:test';
import assert from 'node:assert/strict';
import { OrganizationComposition } from '../../../src/composition/modules/organization.composition.ts';
import type { PermissionContext } from '../../../src/core/access-control/permission.intercept.ts';
import { ExecutionContext } from '../../../src/core/context/execution.context.ts';
import { CNPJ } from '../../../src/core/entities/organization/domain/cnpj.ts';
import { OrganizationSlug } from '../../../src/core/entities/organization/domain/organization.slug.ts';
import type { Organization } from '../../../src/core/entities/organization/organization.ts';
import { DatabaseMock } from '../../../src/mocks/database.ts';
import { LoggerMock } from '../../../src/mocks/logger.ts';
import { OrganizationRepositoryMock } from '../../../src/mocks/organization.repository.ts';
import type { Status } from '../../../src/mocks/status.ts';
import { PasswordHashMock } from '../../../src/mocks/password.hash.ts';

const actorValidationQuery = {
  findById: async (id: string) => ({ id, type: 'USER' as const, enabled: true, emailVerified: true }),
};

const organizationStatusPolicy = {
  isEnabled: (status: Status) => status === 'active',
};

const organizationSlugPolicy = {
  isReserved: (slug: string) => ['admin', 'api', 'auth', 'www'].includes(slug),
};

function validOrganization(): Organization<Status> {
  return {
    id: 'organization-1',
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    updatedAt: new Date('2026-07-16T00:00:00.000Z'),
    status: 'active',
    name: 'Maumenvi',
    slug: new OrganizationSlug('maumenvi'),
    cnpj: new CNPJ('90.021.382/0001-22'),
    ownerActorId: 'actor-1',
  };
}

const permissionContext: PermissionContext = {
  id: 'membership-1',
  actorId: 'actor-1',
  organizationId: 'organization-1',
  permissions: [
    'organization:create',
    'organization:update',
    'organization:change-status',
    'organization:find',
  ].map((permission) => ({
    membershipId: 'membership-1',
    permission: permission as PermissionContext['permissions'][number]['permission'],
    effect: 'allow',
  })),
};

test('Expõe todos os handlers do módulo Organization', () => {
  const executionContext = new ExecutionContext({
    databaseProvider: new DatabaseMock(),
    loggerProvider: new LoggerMock(),
    passwordHashProvider: new PasswordHashMock(),
  });

  const composition = new OrganizationComposition<Status>({
    executionContext,
    organizationRepository: new OrganizationRepositoryMock(),
    actorValidationQuery,
    policy: { organizationStatusPolicy, organizationSlugPolicy },
    permissionContext,
  });

  assert.equal(typeof composition.create, 'function');
  assert.equal(typeof composition.update, 'function');
  assert.equal(typeof composition.changeStatus, 'function');
  assert.equal(typeof composition.findById, 'function');
  assert.equal(typeof composition.findByCnpj, 'function');
  assert.equal(typeof composition.findBySlug, 'function');
  assert.equal(typeof composition.validationQuery.findById, 'function');
});

test('Executa todos os handlers com o repository configurado', async () => {
  const database = new DatabaseMock();
  const organizations = new OrganizationRepositoryMock();
  const composition = new OrganizationComposition<Status>({
    executionContext: new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    organizationRepository: organizations,
    actorValidationQuery,
    policy: { organizationStatusPolicy, organizationSlugPolicy },
  });
  const organization = validOrganization();

  await composition.create(organization);

  assert.deepEqual(await composition.findById(organization.id), organization);
  assert.deepEqual(await composition.findByCnpj(organization.cnpj.value), organization);
  assert.deepEqual(await composition.findBySlug(organization.slug.value), organization);
  assert.deepEqual(await composition.validationQuery.findById(organization.id), {
    id: organization.id,
    enabled: true,
  });

  const updatedOrganization = {
    ...organization,
    name: 'Maumenvi Tecnologia',
    updatedAt: new Date('2026-07-16T12:00:00.000Z'),
  };
  await composition.update(updatedOrganization);
  assert.deepEqual(await composition.findById(organization.id), updatedOrganization);

  await composition.changeStatus(updatedOrganization);
  assert.equal(organizations.organizations[0]?.status, 'inactive');
});
