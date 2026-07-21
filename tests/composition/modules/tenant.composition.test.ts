import assert from 'node:assert/strict';
import test from 'node:test';
import { TenantComposition } from '../../../src/composition/modules/tenant.composition.ts';
import { ExecutionContext } from '../../../src/core/context/execution.context.ts';
import { CNPJ } from '../../../src/core/entities/organization/domain/cnpj.ts';
import { OrganizationSlug } from '../../../src/core/entities/organization/domain/organization.slug.ts';
import { DatabaseMock } from '../../../src/mocks/database.ts';
import { LoggerMock } from '../../../src/mocks/logger.ts';
import { OrganizationRepositoryMock } from '../../../src/mocks/organization.repository.ts';
import { PasswordHashMock } from '../../../src/mocks/password.hash.ts';
import type { Status } from '../../../src/mocks/status.ts';

test('Expõe a resolução pública de tenant', async () => {
  const repository = new OrganizationRepositoryMock();
  await repository.save({
    id: 'organization-1',
    createdAt: new Date('2026-07-21T00:00:00.000Z'),
    updatedAt: new Date('2026-07-21T00:00:00.000Z'),
    status: 'active',
    name: 'Maumenvi',
    slug: new OrganizationSlug('maumenvi'),
    cnpj: new CNPJ('90.021.382/0001-22'),
    ownerActorId: 'actor-1',
  });
  const composition = new TenantComposition<Status>({
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    organizationRepository: repository,
    policy: {
      organizationStatusPolicy: {
        isEnabled: (status) => status === 'active',
      },
      organizationSlugPolicy: {
        isReserved: () => false,
      },
    },
  });

  assert.deepEqual(await composition.resolve('MAUMENVI'), {
    organizationId: 'organization-1',
    slug: 'maumenvi',
  });
});
