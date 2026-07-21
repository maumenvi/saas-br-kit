import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { UpdateMembershipUseCase } from '../../../../../src/core/entities/membership/application/membership.update.ts';
import type { MembershipRepositoryPort } from '../../../../../src/core/entities/membership/membership.repositories.ts';
import type { Membership } from '../../../../../src/core/entities/membership/membership.ts';

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

test('UpdateMembershipUseCase delega a operação ao repository', async () => {
  const membership = membershipFixture();
  let received: Membership<'active'> | undefined;
  const repository = {
    update: async (value: Membership<'active'>) => {
      received = value;
    },
  } as unknown as MembershipRepositoryPort<'active'>;
  const useCase = new UpdateMembershipUseCase(executionContext(), repository);

  await useCase.update(membership);

  assert.equal(received, membership);
});