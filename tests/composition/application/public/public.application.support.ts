import { ExecutionContext } from '../../../../src/core/context/execution.context.ts';
import type { TokenPort } from '../../../../src/core/ports/token.port.ts';
import { ActorRepositoryMock } from '../../../../src/mocks/actor.repository.ts';
import { AuditRepositoryMock } from '../../../../src/mocks/audit.repository.ts';
import { DatabaseMock } from '../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../src/mocks/logger.ts';
import { MembershipRepositoryMock } from '../../../../src/mocks/membership.repository.ts';
import { OrganizationRepositoryMock } from '../../../../src/mocks/organization.repository.ts';
import { PasswordHashMock } from '../../../../src/mocks/password.hash.ts';
import {
  PolicyActor,
  PolicyOrganization,
  PolicyOrganizationSlug,
  type Status,
} from '../../../../src/mocks/status.ts';

export type Statuses = {
  actors: Status;
  organizations: Status;
  memberships: Status;
};

export type Extras = {
  actors: unknown;
  organizations: unknown;
  memberships: unknown;
};

function tokenPort(): TokenPort<string> {
  return {
    payload: { actorId: 'actor-1', organizationId: 'organization-1' },
    config: undefined,
    refreshPayload: undefined,
    refreshConfig: undefined,
    createToken: () => 'generated-token',
    generateToken: async () => 'generated-token',
    verifyToken: async () => ({}),
    generateRefreshToken: async () => 'generated-refresh-token',
    verifyRefreshToken: async () => ({}),
  };
}

export function publicApplicationInput() {
  return {
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    authentication: {
      type: 'LOGIN' as const,
      tokenPort: tokenPort(),
    },
    repositories: {
      actors: new ActorRepositoryMock(),
      audits: new AuditRepositoryMock(),
      memberships: new MembershipRepositoryMock(),
      organizations: new OrganizationRepositoryMock(),
    },
    policy: {
      actor: {
        actorStatusPolicy: new PolicyActor(),
      },
      organization: {
        organizationStatusPolicy: new PolicyOrganization(),
        organizationSlugPolicy: new PolicyOrganizationSlug(),
      },
    },
  };
}
