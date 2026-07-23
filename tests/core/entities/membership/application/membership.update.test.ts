import assert from 'node:assert/strict';
import test from 'node:test';
import type { PermissionContext } from '../../../../../src/core/access-control/permission.intercept.ts';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { UpdateMembershipUseCase } from '../../../../../src/core/entities/membership/application/membership.update.ts';
import type { MembershipRepositoryPort } from '../../../../../src/core/entities/membership/membership.repositories.ts';
import type { MemberPermission, Membership } from '../../../../../src/core/entities/membership/membership.ts';

function membershipFixture(): Membership<'active'> {
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

function executionContext(): ExecutionContext {
  return {
    databaseProvider: {
      run: async (callback) => callback(undefined),
    },
  } as ExecutionContext;
}

function permissionContext(): PermissionContext {
  return {
    id: 'membership-admin',
    actorId: 'actor-admin',
    organizationId: 'organization-1',
    permissions: [],
  };
}

function selfPermissionContext(): PermissionContext {
  return {
    id: 'membership-1',
    actorId: 'actor-1',
    organizationId: 'organization-1',
    permissions: [{
      membershipId: 'membership-1',
      permission: 'membership:update',
      effect: 'allow',
    }],
  };
}

function updatePermission(): MemberPermission {
  return {
    id: 'permission-update',
    membershipId: 'membership-1',
    permission: 'membership:update',
    effect: 'allow',
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    createdByActorId: 'actor-admin',
  };
}

test('UpdateMembershipUseCase delega a operação ao repository', async () => {
  const membership = membershipFixture();
  let received: Membership<'active'> | undefined;
  const repository = {
    update: async (value: Membership<'active'>) => {
      received = value;
    },
  } as unknown as MembershipRepositoryPort<'active'>;
  const useCase = new UpdateMembershipUseCase(
    executionContext(),
    repository,
    permissionContext(),
  );

  await useCase.update(membership);

  assert.equal(received, membership);
});

test('Rejeita atualização própria quando as permissões mudam', async () => {
  const membership = {
    ...membershipFixture(),
    permissions: [
      updatePermission(),
      {
        ...updatePermission(),
        id: 'permission-find',
        permission: 'membership:find' as const,
        createdByActorId: 'actor-1',
      },
    ],
  };
  let repositoryCalled = false;
  const repository = {
    update: async () => {
      repositoryCalled = true;
    },
  } as unknown as MembershipRepositoryPort<'active'>;
  const useCase = new UpdateMembershipUseCase(
    executionContext(),
    repository,
    selfPermissionContext(),
  );

  await assert.rejects(
    useCase.update(membership),
    { code: 'MEMBERSHIP_SELF_ELEVATION_NOT_ALLOWED' },
  );
  assert.equal(repositoryCalled, false);
});
