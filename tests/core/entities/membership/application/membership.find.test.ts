import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { FindMembershipByIdUseCase } from '../../../../../src/core/entities/membership/application/membership.find.ts';
import type { MembershipRepositoryPort } from '../../../../../src/core/entities/membership/membership.repositories.ts';
import type { Membership } from '../../../../../src/core/entities/membership/membership.ts';

test('FindMembershipByIdUseCase delega a operação ao repository', async () => {
  const membership = membershipFixture();
  let received: string | undefined;
  const repository = {
    findById: async (id: string) => {
      received = id;
      return membership;
    },
  } as unknown as MembershipRepositoryPort<'active'>;
  const useCase = new FindMembershipByIdUseCase(executionContext(), repository);

  const result = await useCase.findById(membership.id);

  assert.equal(received, membership.id);
  assert.equal(result, membership);
});

function membershipFixture(): Membership<'active'> {
  return {
    id: 'membership-1',
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    updatedAt: new Date('2026-07-16T00:00:00.000Z'),
    status: 'active',
    organizationId: 'organization-1',
    userId: 'user-1',
    roleId: 'role-1',
  };
}

function executionContext(): ExecutionContext {
  return {
    databaseProvider: {
      run: async (callback) => callback(undefined),
    },
  } as ExecutionContext;
}