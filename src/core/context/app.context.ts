import type { AuthType } from '../entities/auth/application/auth.authorize.ts';
import type { AuthPort } from '../entities/auth/auth.port.ts';
import type { ApiKeyAuth } from '../entities/auth/domain/auth.api-key.ts';
import type { CredentialsAuth } from '../entities/auth/domain/auth.credentials.ts';
import type { OAuthAuth } from '../entities/auth/domain/auth.oauth.ts';
import type { ActorStatusPolicyPort } from '../entities/actor/policies/actor.status.police.ts';
import type { ActorRepositoryPort } from '../entities/actor/actor.repositories.ts';
import type { AuditRepositoryPort } from '../entities/audit/audit.repositories.ts';
import type { MembershipRepositoryPort } from '../entities/membership/membership.repositories.ts';
import { type OrganizationRepositoryPort } from '../entities/organization/organization.repositories.ts';
import type { OrganizationSlugPolicyPort } from '../entities/organization/policies/organization.slug.policy.ts';
import type { OrganizationStatusPolicyPort } from '../entities/organization/policies/organizations.status.police.ts';
import type { TokenPort } from '../ports/token.port.ts';
import { ExecutionContext, type ExecutionContextInput } from './execution.context.ts';

export type RepositoriesStatus = {
  actors: unknown;
  organizations: unknown;
  memberships: unknown;
};

export type RepositoriesExtra = {
  actors: unknown;
  organizations: unknown;
  memberships: unknown;
};

export type Repositories<Statuses extends RepositoriesStatus, Extras extends RepositoriesExtra = RepositoriesExtra> = {
  actors: ActorRepositoryPort<Statuses['actors'], Extras['actors']>;
  audits: AuditRepositoryPort;
  organizations: OrganizationRepositoryPort<Statuses['organizations'], Extras['organizations']>;
  memberships: MembershipRepositoryPort<Statuses['memberships'], Extras['memberships']>;
}

type AuthenticationBase<TokenOutput> = {
  tokenPort: TokenPort<TokenOutput>;
};

type AuthenticationConfig<
  TokenOutput,
  CustomAuth,
> = AuthenticationBase<TokenOutput> & (
  | { type: 'LOGIN' }
  | { type: 'CREDENTIALS'; service: AuthPort<CredentialsAuth> }
  | { type: 'OAUTH'; service: AuthPort<OAuthAuth> }
  | { type: 'API_KEY'; service: AuthPort<ApiKeyAuth> }
  | { type: 'CUSTOM'; service: AuthPort<CustomAuth> }
);

export type Authentication<
  TokenOutput,
  Type extends AuthType = AuthType,
  CustomAuth = Record<string, unknown>,
> = Extract<AuthenticationConfig<TokenOutput, CustomAuth>, { type: Type }>;

export type AppContextInput<
  Statuses extends RepositoriesStatus,
  Extras extends RepositoriesExtra,
  TokenOutput,
  AuthenticationType extends AuthType = 'LOGIN',
  CustomAuth = Record<string, unknown>,
> = {
  executionContextInput: ExecutionContextInput;
  repositories: Repositories<Statuses, Extras>;
  authentication: Authentication<TokenOutput, AuthenticationType, CustomAuth>;
  policy: {
    actor: {
      actorStatusPolicy: ActorStatusPolicyPort<Statuses['actors']>;
    },
    organization: {
      organizationStatusPolicy: OrganizationStatusPolicyPort<Statuses['organizations']>;
      organizationSlugPolicy: OrganizationSlugPolicyPort;
    }
  }
};

export class AppContext<
  Statuses extends RepositoriesStatus,
  Extras extends RepositoriesExtra = RepositoriesExtra,
  TokenOutput = unknown,
  AuthenticationType extends AuthType = 'LOGIN',
  CustomAuth = Record<string, unknown>,
> {
  public executionContext: ExecutionContext;
  public repositories: Repositories<Statuses, Extras>;

  constructor(
    input: AppContextInput<
      Statuses,
      Extras,
      TokenOutput,
      AuthenticationType,
      CustomAuth
    >,
  ) {
    this.executionContext = new ExecutionContext(input.executionContextInput);
    this.repositories = input.repositories;
  }
}
