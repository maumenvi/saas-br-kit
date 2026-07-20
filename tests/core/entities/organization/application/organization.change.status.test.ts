import test from 'node:test';
import assert from 'node:assert/strict';
import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import type { Organization } from '../../../../../src/core/entities/organization/organization.ts';
import { ChangeOrganizationStatusUseCase } from '../../../../../src/core/entities/organization/application/organization.change.status.ts';
import { CNPJ } from '../../../../../src/core/entities/organization/domain/cnpj.ts';
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
    cnpj: new CNPJ('90.021.382/0001-22'),
    ownerActorId: 'actor-1',
  };
}

test('Altera o status da organização dentro da transação', async () => {
  const database = new DatabaseMock();
  const organizations = new OrganizationRepositoryMock();
  const useCase = new ChangeOrganizationStatusUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    organizations,
  );
  const organization = validOrganization();
  await organizations.save(organization);

  await useCase.changeStatus(organization);

  assert.equal(organizations.organizations[0]?.status, 'inactive');
  assert.equal(database.started, 1);
  assert.equal(database.commited, 1);
  assert.equal(database.rolledback, 0);
});

test('Propaga falha ao alterar status e registra rollback', async () => {
  const failure = new Error('Repository failed');
  const database = new DatabaseMock();
  const organizations: OrganizationRepositoryPort<Status, unknown> = new OrganizationRepositoryMock();
  organizations.changeStatus = async () => {
    throw failure;
  };
  const useCase = new ChangeOrganizationStatusUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    organizations,
  );

  await assert.rejects(useCase.changeStatus(validOrganization()), (error) => error === failure);
  assert.equal(database.started, 1);
  assert.equal(database.commited, 0);
  assert.equal(database.rolledback, 1);
});
