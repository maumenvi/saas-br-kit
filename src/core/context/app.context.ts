import type { MembershipRepositoryPort } from '../entities/membership/membership.repositories.ts';
import { type OrganizationRepositoryPort } from '../entities/organization/organization.repositories.ts';
import type { OrganizationStatusPolicyPort } from '../entities/organization/policies/organizations.status.police.ts';
import type { UserStatusPolicyPort } from '../entities/user/policies/user.status.police.ts';
import type { UserRepositoryPort } from '../entities/user/user.repositories.ts';
import type { TokenPort } from '../index.ts';
import { ExecutionContext, type ExecutionContextInput } from "./execution.context.ts";

export type RepositoriesStatus = {
  users: unknown;
  organizations: unknown;
  memberships: unknown;
}

export type RepositoriesExtra = {
  users: unknown;
  organizations: unknown;
  memberships: unknown;
}


export type Repositories<Statuses extends RepositoriesStatus, Extras extends RepositoriesExtra = RepositoriesExtra> = {
  users: UserRepositoryPort<Statuses['users'], Extras['users']>;
  organizations: OrganizationRepositoryPort<Statuses['organizations'], Extras['organizations']>;
  memberships: MembershipRepositoryPort<Statuses['memberships'], Extras['memberships']>;
}


export type AppContextInput<Statuses extends RepositoriesStatus, Extras extends RepositoriesExtra, TokenOutput> = {
  executionContextInput: ExecutionContextInput;
  repositories: Repositories<Statuses, Extras>;
  authentication: {
    tokenPort: TokenPort<TokenOutput>;
  };
  policy: {
    user: {
      userStatusPolicy: UserStatusPolicyPort<Statuses['users']>;
    },
    organization: {
      organizationStatusPolicy: OrganizationStatusPolicyPort<Statuses['organizations']>;
    }
  }
}

export class AppContext<Statuses extends RepositoriesStatus, Extras extends RepositoriesExtra = RepositoriesExtra, TokenOutput = unknown> {
  public executionContext: ExecutionContext;
  public repositories: Repositories<Statuses, Extras>;

  constructor(input: AppContextInput<Statuses, Extras, TokenOutput>) {
    this.executionContext = new ExecutionContext(input.executionContextInput);
    this.repositories = input.repositories;
  }
}
