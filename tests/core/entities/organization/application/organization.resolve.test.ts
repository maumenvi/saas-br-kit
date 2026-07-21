import assert from 'node:assert/strict';
import test from 'node:test';
import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { ResolveOrganizationTenantUseCase } from '../../../../../src/core/entities/organization/application/organization.resolve.ts';
import { CNPJ } from '../../../../../src/core/entities/organization/domain/cnpj.ts';
import { OrganizationSlug } from '../../../../../src/core/entities/organization/domain/organization.slug.ts';
import type { Organization } from '../../../../../src/core/entities/organization/organization.ts';
import type { OrganizationRepositoryPort } from '../../../../../src/core/entities/organization/organization.repositories.ts';
import { DomainError } from '../../../../../src/core/shared/domain/domain.error.ts';
import { DatabaseMock } from '../../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../../src/mocks/logger.ts';
import { OrganizationRepositoryMock } from '../../../../../src/mocks/organization.repository.ts';
import { PasswordHashMock } from '../../../../../src/mocks/password.hash.ts';
import type { Status } from '../../../../../src/mocks/status.ts';

const statusPolicy = {
  isEnabled: (status: Status) => status === 'active',
};

const slugPolicy = {
  isReserved: (slug: string) => ['admin', 'api', 'auth', 'www'].includes(slug),
};

function organization(status: Status = 'active'): Organization<Status> {
  return {
    id: 'organization-1',
    createdAt: new Date('2026-07-21T00:00:00.000Z'),
    updatedAt: new Date('2026-07-21T00:00:00.000Z'),
    status,
    name: 'Maumenvi',
    slug: new OrganizationSlug('maumenvi'),
    cnpj: new CNPJ('90.021.382/0001-22'),
    ownerActorId: 'actor-1',
  };
}

function setup(
  repository: Pick<OrganizationRepositoryPort<Status, unknown>, 'findBySlug'> =
    new OrganizationRepositoryMock(),
) {
  const database = new DatabaseMock();
  const useCase = new ResolveOrganizationTenantUseCase(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    repository,
    statusPolicy,
    slugPolicy,
  );

  return { database, useCase };
}

test('Resolve somente a identidade pública do tenant habilitado', async () => {
  const repository = new OrganizationRepositoryMock();
  await repository.save(organization());
  const { database, useCase } = setup(repository);

  const resolved = await useCase.resolve('  MAUMENVI  ');

  assert.deepEqual(resolved, {
    organizationId: 'organization-1',
    slug: 'maumenvi',
  });
  assert.equal(Object.isFrozen(resolved), true);
  assert.equal(database.commited, 1);
});

test('Retorna nulo para tenant inexistente ou desabilitado', async () => {
  const repository = new OrganizationRepositoryMock();
  const { useCase } = setup(repository);

  assert.equal(await useCase.resolve('missing'), null);

  await repository.save(organization('suspended'));
  assert.equal(await useCase.resolve('maumenvi'), null);
});

test('Rejeita slug inválido ou reservado antes da transação', async () => {
  const { database, useCase } = setup();

  await assert.rejects(
    useCase.resolve('invalid.slug'),
    (error) =>
      error instanceof DomainError &&
      error.code === 'ORGANIZATION_INVALID_SLUG',
  );
  await assert.rejects(
    useCase.resolve('admin'),
    (error) =>
      error instanceof DomainError &&
      error.code === 'ORGANIZATION_SLUG_RESERVED',
  );
  assert.equal(database.started, 0);
});

test('Propaga falha do repository e registra rollback', async () => {
  const failure = new Error('Repository failed');
  const { database, useCase } = setup({
    findBySlug: async () => {
      throw failure;
    },
  });

  await assert.rejects(useCase.resolve('maumenvi'), (error) => error === failure);
  assert.equal(database.rolledback, 1);
});
