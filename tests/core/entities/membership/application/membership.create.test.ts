import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { CreateMembershipUseCase } from '../../../../../src/core/entities/membership/application/membership.create.ts';
import type { MembershipRepositoryPort } from '../../../../../src/core/entities/membership/membership.repositories.ts';
import type { Membership } from '../../../../../src/core/entities/membership/membership.ts';
import { DomainError } from '../../../../../src/core/shared/domain/domain.error.ts';

const existingActor = {
  findById: async (id: string) => ({ id, type: 'USER' as const, enabled: true, emailVerified: true }),
};

const existingOrganization = {
  findById: async (id: string) => ({ id, enabled: true }),
};

test('CreateMembershipUseCase delega a operação ao repository', async () => {
  const membership = membershipFixture();
  let received: Membership<'active'> | undefined;
  const repository = {
    save: async (value: Membership<'active'>) => {
      received = value;
    },
  } as unknown as MembershipRepositoryPort<'active'>;
  const useCase = new CreateMembershipUseCase(
    executionContext(),
    repository,
    existingActor,
    existingOrganization,
  );

  await useCase.execute(membership);

  assert.equal(received, membership);
});

test('Valida se o actor referenciado existe', async () => {
  const repository = {} as MembershipRepositoryPort<'active'>;
  const useCase = new CreateMembershipUseCase(
    executionContext(),
    repository,
    { findById: async () => null },
    existingOrganization,
  );

  await assert.rejects(
    useCase.validate(membershipFixture()),
    (error) =>
      error instanceof DomainError &&
      error.code === 'MEMBERSHIP_ACTOR_NOT_FOUND',
  );
});

test('Valida se o actor referenciado está habilitado', async () => {
  const repository = {} as MembershipRepositoryPort<'active'>;
  const useCase = new CreateMembershipUseCase(
    executionContext(),
    repository,
    {
      findById: async (id) => ({
        id,
        type: 'SERVICE' as const,
        enabled: false,
      }),
    },
    existingOrganization,
  );

  await assert.rejects(
    useCase.execute(membershipFixture()),
    (error) =>
      error instanceof DomainError &&
      error.code === 'MEMBERSHIP_ACTOR_NOT_ENABLED',
  );
});

test('Valida se a organização referenciada existe e está habilitada', async () => {
  const repository = {} as MembershipRepositoryPort<'active'>;
  const missingOrganization = new CreateMembershipUseCase(
    executionContext(),
    repository,
    existingActor,
    { findById: async () => null },
  );
  const disabledOrganization = new CreateMembershipUseCase(
    executionContext(),
    repository,
    existingActor,
    { findById: async (id) => ({ id, enabled: false }) },
  );

  await assert.rejects(
    missingOrganization.execute(membershipFixture()),
    (error) =>
      error instanceof DomainError &&
      error.code === 'MEMBERSHIP_ORGANIZATION_NOT_FOUND',
  );
  await assert.rejects(
    disabledOrganization.execute(membershipFixture()),
    (error) =>
      error instanceof DomainError &&
      error.code === 'MEMBERSHIP_ORGANIZATION_NOT_ENABLED',
  );
});

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
