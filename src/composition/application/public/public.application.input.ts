import type {
  Authentication,
  Repositories,
  RepositoriesExtra,
  RepositoriesStatus,
} from '../../../core/context/app.context.ts';
import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import type { AuthType } from '../../../core/entities/auth/application/auth.authorize.ts';
import type { ActorStatusPolicyPort } from '../../../core/entities/actor/policies/actor.status.police.ts';
import type { OrganizationSlugPolicyPort } from '../../../core/entities/organization/policies/organization.slug.policy.ts';
import type { OrganizationStatusPolicyPort } from '../../../core/entities/organization/policies/organizations.status.police.ts';

export type PublicApplicationInput<
  TokenOutput,
  Statuses extends RepositoriesStatus,
  Extras extends RepositoriesExtra,
  AuthenticationType extends AuthType = 'LOGIN',
  CustomAuth = Record<string, unknown>,
> = {
  executionContext: ExecutionContext;
  authentication: Authentication<
    TokenOutput,
    AuthenticationType,
    CustomAuth
  >;
  repositories: Repositories<Statuses, Extras>;
  policy: {
    actor: {
      actorStatusPolicy: ActorStatusPolicyPort<Statuses['actors']>;
    };
    organization: {
      organizationStatusPolicy: OrganizationStatusPolicyPort<
        Statuses['organizations']
      >;
      organizationSlugPolicy: OrganizationSlugPolicyPort;
    };
  };
};
