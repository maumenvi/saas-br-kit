import assert from 'node:assert/strict';
import test from 'node:test';
import { MembershipComposition } from '../../../src/composition/modules/membership.composition.ts';
import type { PermissionContext } from '../../../src/core/access-control/permission.intercept.ts';
import { ExecutionContext } from '../../../src/core/context/execution.context.ts';
import type { Membership } from '../../../src/core/entities/membership/membership.ts';
import { DatabaseMock } from '../../../src/mocks/database.ts';
import { LoggerMock } from '../../../src/mocks/logger.ts';
import { MembershipRepositoryMock } from '../../../src/mocks/membership.repository.ts';
import { PasswordHashMock } from '../../../src/mocks/password.hash.ts';
import type { Status } from '../../../src/mocks/status.ts';

const actorValidationQuery = {
  findById: async (id: string) => ({ id, type: 'USER' as const, enabled: true, emailVerified: true }),
};

const organizationValidationQuery = {
  findById: async (id: string) => ({ id, enabled: true }),
};

function membershipFixture(): Membership<Status> {
  return {
    id: 'membership-1',
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    updatedAt: new Date('2026-07-16T00:00:00.000Z'),
    status: 'active',
    organizationId: 'organization-1',
    actorId: 'actor-1',
    role: 'owner',
    permissions: [],
  };
}

const permissionContext: PermissionContext = {
  id: 'membership-1',
  actorId: 'actor-1',
  organizationId: 'organization-1',
  permissions: [
    'membership:create',
    'membership:update',
    'membership:change-status',
    'membership:find',
  ].map((permission) => ({
    membershipId: 'membership-1',
    permission: permission as PermissionContext['permissions'][number]['permission'],
    effect: 'allow',
  })),
};

function setup(
  repository = new MembershipRepositoryMock(),
  protectedHandlers = false,
) {
  const composition = new MembershipComposition<Status>({
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    membershipRepository: repository,
    actorValidationQuery,
    organizationValidationQuery,
    permissionContext: protectedHandlers ? permissionContext : undefined,
  });

  return { composition, repository };
}

test('Expõe todos os handlers do módulo Membership', () => {
  const { composition } = setup();

  assert.equal(typeof composition.create, 'function');
  assert.equal(typeof composition.update, 'function');
  assert.equal(typeof composition.changeStatus, 'function');
  assert.equal(typeof composition.findById, 'function');
  assert.equal(typeof composition.findByOrganizationId, 'function');
  assert.equal(typeof composition.findByActorId, 'function');
});

test('Executa todos os handlers com o repository configurado', async () => {
  const { composition, repository } = setup(
    new MembershipRepositoryMock(),
    true,
  );
  const membership = membershipFixture();

  await composition.create(membership);

  assert.equal(await composition.findById(membership.id), membership);
  assert.deepEqual(
    await composition.findByOrganizationId(membership.organizationId),
    [membership],
  );
  assert.deepEqual(await composition.findByActorId(membership.actorId), [membership]);

  const updatedMembership = {
    ...membership,
    role: 'admin',
    updatedAt: new Date('2026-07-16T12:00:00.000Z'),
  };
  await composition.update(updatedMembership);
  assert.equal(await composition.findById(membership.id), updatedMembership);

  await composition.changeStatus(updatedMembership);
  assert.equal(repository.memberships[0]?.status, 'inactive');
});
