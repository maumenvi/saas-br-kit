import test from 'node:test';
import assert from 'node:assert/strict';
import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { OrganizationCreateUseCase } from '../../../../../src/core/organization/application/use-cases/organization.create.ts';
import type { Organization } from '../../../../../src/core/organization/application/organization.input.ts';
import { CNPJ } from '../../../../../src/core/organization/domain/cnpj.ts';
import type { OrganizationRepositoryPort } from '../../../../../src/core/organization/organization.repositories.ts';
import { DomainError } from '../../../../../src/core/shared/domain/domain.error.ts';
import { DatabaseMock } from '../../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../../src/mocks/logger.ts';
import { OrganizationRepositoryMock } from '../../../../../src/mocks/organization.repository.ts';
import type { Status } from '../../../../../src/mocks/status.ts';

function validOrganization(): Organization<Status> {
  return {
    id: 'organization-1',
    createdAt: new Date('2026-07-14T00:00:00.000Z'),
    updatedAt: new Date('2026-07-14T00:00:00.000Z'),
    status: 'active',
    name: 'Maumenvi',
    cnpj: new CNPJ('90.021.382/0001-22'),
  };
}

test('Valida e salva organização dentro da transação', async () => {
  const database = new DatabaseMock();
  const organizations = new OrganizationRepositoryMock();
  const useCase = new OrganizationCreateUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
    }),
    organizations,
  );
  const organization = validOrganization();

  await useCase.execute(organization);

  assert.deepEqual(organizations.organizations, [organization]);
  assert.equal(database.started, 1);
  assert.equal(database.commited, 1);
  assert.equal(database.rolledback, 0);
});

test('Não inicia transação quando o CNPJ é inválido', async () => {
  const database = new DatabaseMock();
  const organizations = new OrganizationRepositoryMock();
  const useCase = new OrganizationCreateUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
    }),
    organizations,
  );
  const organization = {
    ...validOrganization(),
    cnpj: new CNPJ('invalid-cnpj'),
  };

  await assert.rejects(
    useCase.execute(organization),
    (error) => error instanceof DomainError && error.code === 'ORGANIZATION_INVALID_CNPJ',
  );
  assert.equal(database.started, 0);
  assert.deepEqual(organizations.organizations, []);
});

test('Propaga falha do repositório e registra rollback ao criar', async () => {
  const failure = new Error('Repository failed');
  const database = new DatabaseMock();
  const organizations: OrganizationRepositoryPort<Status> = new OrganizationRepositoryMock();
  organizations.save = async () => {
    throw failure;
  };
  const useCase = new OrganizationCreateUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
    }),
    organizations,
  );

  await assert.rejects(useCase.execute(validOrganization()), (error) => error === failure);
  assert.equal(database.started, 1);
  assert.equal(database.commited, 0);
  assert.equal(database.rolledback, 1);
});
