import test from 'node:test';
import assert from 'node:assert/strict';
import { Application } from '../../src/composition/application.ts';
import { AppContext } from '../../src/core/context/app.context.ts';
import { Email } from '../../src/core/entities/user/domain/email.ts';
import { Telephone } from '../../src/core/entities/user/domain/telephone.ts';
import { DatabaseMock } from '../../src/mocks/database.ts';
import { LoggerMock } from '../../src/mocks/logger.ts';
import { OrganizationRepositoryMock } from '../../src/mocks/organization.repository.ts';
import type { Status } from '../../src/mocks/status.ts';
import { UserRepositoryMock } from '../../src/mocks/user.repository.ts';
import type { User } from '../../src/core/entities/user/application/user.ts';


test('Compõe o contexto e os casos de uso da aplicação', async () => {
  const database = new DatabaseMock();
  const logger = new LoggerMock();
  const UsersRepositories = new UserRepositoryMock();
  const OrganizationsRepositories = new OrganizationRepositoryMock();

  type ApplicationStatuses = {
    users: Status;
    organizations: Status;
  };

  type ApplicationExtras = {
    users: {
      birthday: Date
    };
    organizations: {
      inscricaoEstadual: string
    };
  };
  const application = new Application<ApplicationStatuses, ApplicationExtras>({
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
  assert.ok(application.user.create instanceof Function);

  const user: User<ApplicationStatuses['users'], ApplicationExtras['users']> = {
    id: 'user-1',
    createdAt: new Date('2026-07-13T00:00:00.000Z'),
    updatedAt: new Date('2026-07-13T00:00:00.000Z'),
    status: "active" as Status,
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
    birthday: new Date('1990-01-01T00:00:00.000Z'),
  };

  await application.user.create(user);

  assert.deepEqual(UsersRepositories.users, [user]);
  assert.equal(database.commited, 1);
});
