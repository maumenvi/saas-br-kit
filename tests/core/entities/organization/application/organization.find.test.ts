import test from 'node:test';
import assert from 'node:assert/strict';
import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import type { Organization } from '../../../../../src/core/entities/organization/organization.ts';
import { FindOrganizationByIdUseCase } from '../../../../../src/core/entities/organization/application/organization.find.ts';
import { CNPJ } from '../../../../../src/core/shared/domain/cnpj.ts';
import { OrganizationSlug } from '../../../../../src/core/entities/organization/domain/organization.slug.ts';
import type { OrganizationRepositoryPort } from '../../../../../src/core/entities/organization/organization.repositories.ts';
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

function setup(
  organizations: OrganizationRepositoryPort<Status, unknown> = new OrganizationRepositoryMock(),
) {
  const database = new DatabaseMock();
  const useCase = new FindOrganizationByIdUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    organizations,
  );

  return { database, useCase };
}

test('Localiza organização por id, CNPJ e slug', async () => {
  const organizations = new OrganizationRepositoryMock();
  const organization = validOrganization();
  await organizations.save(organization);
  const { database, useCase } = setup(organizations);

  assert.equal(await useCase.findById(organization.id), organization);
  assert.equal(await useCase.findByCnpj(organization.cnpj.value), organization);
  assert.equal(await useCase.findBySlug('  MAUMENVI  '), organization);
  assert.equal(database.started, 3);
  assert.equal(database.commited, 3);
  assert.equal(database.rolledback, 0);
});

test('Rejeita slug inválido antes de consultar o repository', async () => {
  const { database, useCase } = setup();

  await assert.rejects(
    useCase.findBySlug('invalid.slug'),
    (error) =>
      error instanceof Error &&
      (error as { code?: string }).code === 'ORGANIZATION_INVALID_SLUG',
  );
  assert.equal(database.started, 0);
});

test('Retorna nulo quando a organização não existe', async () => {
  const { database, useCase } = setup();

  assert.equal(await useCase.findById('missing-organization'), null);
  assert.equal(await useCase.findByCnpj('00.000.000/0000-00'), null);
  assert.equal(await useCase.findBySlug('missing'), null);
  assert.equal(database.started, 3);
  assert.equal(database.commited, 3);
  assert.equal(database.rolledback, 0);
});

test('Propaga falha da consulta e registra rollback', async () => {
  const failure = new Error('Repository failed');
  const organizations: OrganizationRepositoryPort<Status, unknown> = new OrganizationRepositoryMock();
  organizations.findById = async () => {
    throw failure;
  };
  const { database, useCase } = setup(organizations);

  await assert.rejects(useCase.findById('organization-1'), (error) => error === failure);
  assert.equal(database.started, 1);
  assert.equal(database.commited, 0);
  assert.equal(database.rolledback, 1);
});

test('Propaga falha da consulta por slug e registra rollback', async () => {
  const failure = new Error('Repository failed');
  const organizations: OrganizationRepositoryPort<Status, unknown> =
    new OrganizationRepositoryMock();
  organizations.findBySlug = async () => {
    throw failure;
  };
  const { database, useCase } = setup(organizations);

  await assert.rejects(useCase.findBySlug('maumenvi'), (error) => error === failure);
  assert.equal(database.rolledback, 1);
});
