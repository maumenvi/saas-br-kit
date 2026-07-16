import { type OrganizationRepositoryPort } from "../organization/organization.repositories.ts";
import type { UserRepositoryPort } from "../user/user.repositories.ts";
import { ExecutionContext, type ExecutionContextInput } from "./execution.context.ts";

export type RepositoriesStatus = {
  users: unknown;
  organizations: unknown;
}

export type RepositoriesExtra = {
  users: unknown;
  organizations: unknown;
}

export type Repositories<Statuses extends RepositoriesStatus, Extras extends RepositoriesExtra = RepositoriesExtra> = {
  users: UserRepositoryPort<Statuses['users'], Extras['users']>;
  organizations: OrganizationRepositoryPort<Statuses['organizations'], Extras['organizations']>;
}


export type AppContextInput<Statuses extends RepositoriesStatus, Extras extends RepositoriesExtra = RepositoriesExtra> = {
  executionContextInput: ExecutionContextInput;
  repositories: Repositories<Statuses, Extras>;
}

export class AppContext<Statuses extends RepositoriesStatus, Extras extends RepositoriesExtra = RepositoriesExtra> {
  public executionContext: ExecutionContext;
  public repositories: Repositories<Statuses, Extras>;

  constructor(input: AppContextInput<Statuses, Extras>) {
    this.executionContext = new ExecutionContext(input.executionContextInput);
    this.repositories = input.repositories;
  }
}
