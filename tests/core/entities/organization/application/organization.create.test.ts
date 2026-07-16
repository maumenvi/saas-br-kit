import test from 'node:test';
import assert from 'node:assert/strict';
import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { OrganizationCreateUseCase } from '../../../../../src/core/entities/organization/application/organization.create.ts';
import type { Organization } from '../../../../../src/core/entities/organization/organization.ts';
import { CNPJ } from '../../../../../src/core/entities/organization/domain/cnpj.ts';
import type { OrganizationRepositoryPort } from '../../../../../src/core/entities/organization/organization.repositories.ts';
import { DomainError } from '../../../../../src/core/shared/domain/domain.error.ts';
import { DatabaseMock } from '../../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../../src/mocks/logger.ts';
import { OrganizationRepositoryMock } from '../../../../../src/mocks/organization.repository.ts';
import type { Status } from '../../../../../src/mocks/status.ts';
import { PasswordHashMock } from '../../../../../src/mocks/password.hash.ts';
import type { RepositoriesExtra } from '../../../../../src/core/context/app.context.ts';
import type { UserValidationQueryPort } from '../../../../../src/core/entities/user/user.validation.query.port.ts';

const existingOwner: UserValidationQueryPort = {
  findById: async (id) => ({ id, enabled: true, emailVerified: true }),
};

function validOrganization(): Organization<Status> {
  return {
    id: 'organization-1',
    createdAt: new Date('2026-07-14T00:00:00.000Z'),
    updatedAt: new Date('2026-07-14T00:00:00.000Z'),
    status: 'active',
    name: 'Maumenvi',
    cnpj: new CNPJ('90.021.382/0001-22'),
    ownerUserId: 'user-1',
  };
}

test('Valida e salva organização dentro da transação', async () => {
  const database = new DatabaseMock();
  const organizations = new OrganizationRepositoryMock();
  const useCase = new OrganizationCreateUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock()
    }),
    organizations,
    existingOwner,
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
      passwordHashProvider: new PasswordHashMock()
    }),
    organizations,
    existingOwner,
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

test('Não inicia transação quando o dono não existe', async () => {
  const database = new DatabaseMock();
  const organizations = new OrganizationRepositoryMock();
  const useCase = new OrganizationCreateUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    organizations,
    { findById: async () => null },
  );

  await assert.rejects(
    useCase.execute(validOrganization()),
    (error) => error instanceof DomainError && error.code === 'ORGANIZATION_OWNER_INVALID',
  );
  assert.equal(database.started, 0);
  assert.deepEqual(organizations.organizations, []);
});

test('Propaga falha do repositório e registra rollback ao criar', async () => {
  const failure = new Error('Repository failed');
  const database = new DatabaseMock();
  const organizations: OrganizationRepositoryPort<Status, RepositoriesExtra['organizations']> = new OrganizationRepositoryMock();
  organizations.save = async () => {
    throw failure;
  };
  const useCase = new OrganizationCreateUseCase<Status>(
    new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock()
    }),
    organizations,
    existingOwner,
  );

  await assert.rejects(useCase.execute(validOrganization()), (error) => error === failure);
  assert.equal(database.started, 1);
  assert.equal(database.commited, 0);
  assert.equal(database.rolledback, 1);
});
