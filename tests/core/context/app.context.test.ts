import test from 'node:test';
import assert from 'node:assert/strict';
import { AppContext } from '../../../src/core/context/app.context.ts';
import { ExecutionContext } from '../../../src/core/context/execution.context.ts';
import { DatabaseMock } from '../../../src/mocks/database.ts';
import { AuditRepositoryMock } from '../../../src/mocks/audit.repository.ts';
import { LoggerMock } from '../../../src/mocks/logger.ts';
import { MembershipRepositoryMock } from '../../../src/mocks/membership.repository.ts';
import { OrganizationRepositoryMock } from '../../../src/mocks/organization.repository.ts';
import { PasswordHashMock } from '../../../src/mocks/password.hash.ts';
import type { TokenPort } from '../../../src/core/ports/token.port.ts';

const policy = {
  actor: {
    actorStatusPolicy: {
      isEnabled: (status: string) => status === 'active',
    },
  },
  organization: {
    organizationStatusPolicy: {
      isEnabled: (status: string) => status === 'active',
    },
    organizationSlugPolicy: {
      isReserved: () => false,
    },
  },
};

const tokenPort: TokenPort<string> = {
  payload: { actorId: 'actor-1', organizationId: 'organization-1' },
  config: undefined,
  refreshPayload: undefined,
  refreshConfig: undefined,
  createToken: () => 'token',
  generateToken: async () => 'token',
  verifyToken: async () => ({}),
  generateRefreshToken: async () => 'refresh-token',
  verifyRefreshToken: async () => ({}),
};

const authentication = {
  type: 'LOGIN' as const,
  tokenPort,
};

test('Cria AppContext com os providers recebidos', () => {
  const database = new DatabaseMock();
  const logger = new LoggerMock();
  const appContext = new AppContext({
    executionContextInput: {
      databaseProvider: database,
      loggerProvider: logger,
      passwordHashProvider: new PasswordHashMock(),
    },
    repositories: {
      actors: new ActorRepositoryMock(),
      audits: new AuditRepositoryMock(),
      organizations: new OrganizationRepositoryMock(),
      memberships: new MembershipRepositoryMock(),
    },
    authentication,
    policy,
  });

  assert.ok(appContext.executionContext instanceof ExecutionContext);
  assert.strictEqual(appContext.executionContext.databaseProvider, database);
  assert.strictEqual(appContext.executionContext.loggerProvider, logger);
});

test('Não compartilha ExecutionContext entre instâncias', () => {
  const appContext1 = new AppContext({
    executionContextInput: {
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    },
    repositories: {
      actors: new ActorRepositoryMock(),
      audits: new AuditRepositoryMock(),
      organizations: new OrganizationRepositoryMock(),
      memberships: new MembershipRepositoryMock(),
    },
    authentication,
    policy,
  });
  const appContext2 = new AppContext({
    executionContextInput: {
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    },
    repositories: {
      actors: new ActorRepositoryMock(),
      audits: new AuditRepositoryMock(),
      organizations: new OrganizationRepositoryMock(),
      memberships: new MembershipRepositoryMock(),
    },
    authentication,
    policy,
  });

  assert.notStrictEqual(appContext1.executionContext, appContext2.executionContext);
});
import { ActorRepositoryMock } from '../../../src/mocks/actor.repository.ts';
