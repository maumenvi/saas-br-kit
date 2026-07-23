import test from 'node:test';
import assert from 'node:assert/strict';
import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import type { Organization } from '../../../../../src/core/entities/organization/organization.ts';
import { UpdateOrganizationUseCase } from '../../../../../src/core/entities/organization/application/organization.update.ts';
import { CNPJ } from '../../../../../src/core/shared/domain/cnpj.ts';
import { OrganizationSlug } from '../../../../../src/core/entities/organization/domain/organization.slug.ts';
import type { OrganizationRepositoryPort } from '../../../../../src/core/entities/organization/organization.repositories.ts';
import { DomainError } from '../../../../../src/core/shared/domain/domain.error.ts';
import { DatabaseMock } from '../../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../../src/mocks/logger.ts';
import { OrganizationRepositoryMock } from '../../../../../src/mocks/organization.repository.ts';
import type { Status } from '../../../../../src/mocks/status.ts';
import { PasswordHashMock } from '../../../../../src/mocks/password.hash.ts';

function validOrganization(): Organization<Status> {
  return {
    id: 'organization-1',
    createdAt: new Date('2026-07-14T00:00:00.000Z'),
    updatedAt: new Date('2026-07-14T00:00:00.000Z'),
    status: 'active',
    name: 'Maumenvi',
    slug: new OrganizationSlug('maumenvi'),
    cnpj: new CNPJ('90.021.382/0001-22'),
    ownerActorId: 'actor-1',
  };
}

const organizationSlugPolicy = {
  isReserved: (slug: string) => ['admin', 'api', 'auth', 'www'].includes(slug),
};

function setup(
  organizations: OrganizationRepositoryPort<Status, unknown> = new OrganizationRepositoryMock(),
) {
  const database = new DatabaseMock();
  const useCase = new UpdateOrganizationUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    organizations,
    organizationSlugPolicy,
  );

  return { database, useCase };
}

test('Valida e atualiza organização dentro da transação', async () => {
  const organizations = new OrganizationRepositoryMock();
  const currentOrganization = validOrganization();
  await organizations.save(currentOrganization);
  const updatedOrganization = {
    ...currentOrganization,
    updatedAt: new Date('2026-07-14T12:00:00.000Z'),
    name: 'Maumenvi Tecnologia',
  };
  const { database, useCase } = setup(organizations);

  await useCase.update(updatedOrganization);

  assert.deepEqual(organizations.organizations, [updatedOrganization]);
  assert.notStrictEqual(organizations.organizations[0], updatedOrganization);
  assert.equal(Object.isFrozen(organizations.organizations[0]), true);
  assert.equal(database.started, 1);
  assert.equal(database.commited, 1);
  assert.equal(database.rolledback, 0);
});

test('Não inicia transação quando o CNPJ é inválido ao atualizar', async () => {
  const organizations = new OrganizationRepositoryMock();
  const currentOrganization = validOrganization();
  await organizations.save(currentOrganization);
  const invalidOrganization = {
    ...currentOrganization,
    cnpj: new CNPJ('invalid-cnpj'),
  };
  const { database, useCase } = setup(organizations);

  await assert.rejects(
    useCase.update(invalidOrganization),
    (error) => error instanceof DomainError && error.code === 'DOCUMENT_INVALID_CNPJ',
  );
  assert.deepEqual(organizations.organizations, [currentOrganization]);
  assert.equal(database.started, 0);
});

test('Não inicia transação quando o slug é inválido ou reservado ao atualizar', async () => {
  const { database, useCase } = setup();

  await assert.rejects(
    useCase.update({
      ...validOrganization(),
      slug: new OrganizationSlug('invalid.slug'),
    }),
    (error) =>
      error instanceof DomainError &&
      error.code === 'ORGANIZATION_INVALID_SLUG',
  );
  await assert.rejects(
    useCase.update({
      ...validOrganization(),
      slug: new OrganizationSlug('api'),
    }),
    (error) =>
      error instanceof DomainError &&
      error.code === 'ORGANIZATION_SLUG_RESERVED',
  );

  assert.equal(database.started, 0);
});

test('Rejeita slug usado por outra organização', async () => {
  const organizations = new OrganizationRepositoryMock();
  await organizations.save(validOrganization());
  const { database, useCase } = setup(organizations);

  await assert.rejects(
    useCase.update({
      ...validOrganization(),
      id: 'organization-2',
    }),
    (error) =>
      error instanceof DomainError &&
      error.code === 'ORGANIZATION_SLUG_ALREADY_EXISTS',
  );

  assert.equal(database.rolledback, 1);
});

test('Propaga falha da atualização e registra rollback', async () => {
  const failure = new Error('Repository failed');
  const organizations: OrganizationRepositoryPort<Status, unknown> = new OrganizationRepositoryMock();
  organizations.update = async () => {
    throw failure;
  };
  const { database, useCase } = setup(organizations);

  await assert.rejects(useCase.update(validOrganization()), (error) => error === failure);
  assert.equal(database.started, 1);
  assert.equal(database.commited, 0);
  assert.equal(database.rolledback, 1);
});
