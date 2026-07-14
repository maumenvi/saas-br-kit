import test from 'node:test';
import assert from 'node:assert/strict';
import { Aplication } from '../../src/composition/application.ts';
import { AppContext } from '../../src/core/context/app.context.ts';
import { CreateUserUseCase } from '../../src/core/user/application/use-cases/user.create.ts';
import { Email } from '../../src/core/user/domain/email.ts';
import { Telephone } from '../../src/core/user/domain/telephone.ts';
import { DatabaseMock } from '../../src/mocks/database.ts';
import { LoggerMock } from '../../src/mocks/logger.ts';
import { OrganizationRepositoryMock } from '../../src/mocks/organization.repository.ts';
import type { Status } from '../../src/mocks/status.ts';
import { UserRepositoryMock } from '../../src/mocks/user.repository.ts';

test('Compõe o contexto e os casos de uso da aplicação', async () => {
  const database = new DatabaseMock();
  const logger = new LoggerMock();
  const UsersRepositories = new UserRepositoryMock();
  const OrganizationsRepositories = new OrganizationRepositoryMock();

  type ApplicationStatuses = {
    users: Status;
    organizations: Status;
  };

  const application = new Aplication<ApplicationStatuses>({
    executionContextInput: {
      databaseProvider: database,
      loggerProvider: logger,
    },
    repositories: {
      users: UsersRepositories,
      organizations: OrganizationsRepositories,
    },
  });

  assert.ok(application.context instanceof AppContext);
  assert.ok(application.user.create instanceof CreateUserUseCase);

  const user = {
    id: 'user-1',
    createdAt: new Date('2026-07-13T00:00:00.000Z'),
    updatedAt: new Date('2026-07-13T00:00:00.000Z'),
    status: "active" as Status,
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
  };

  await application.user.create.execute(user);

  assert.deepEqual(UsersRepositories.users, [user]);
  assert.equal(database.commited, 1);
});
