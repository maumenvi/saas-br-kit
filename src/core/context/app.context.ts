import { type OrganizationRepositoryPort } from "../organization/organization.repositories.ts";
import type { UserRepositoryPort } from "../user/user.repositories.ts";
import { ExecutionContext, type ExecutionContextInput } from "./execution.context.ts";

export type RepositoriesStatus = {
  users: unknown;
  organizations: unknown;
}

export type Repositories<Statuses extends RepositoriesStatus> = {
  users: UserRepositoryPort<Statuses['users']>;
  organizations: OrganizationRepositoryPort<Statuses['organizations']>;
}

export type AppContextInput<Statuses extends RepositoriesStatus> = {
  executionContextInput: ExecutionContextInput;
  repositories: Repositories<Statuses>;
}

export class AppContext<Statuses extends RepositoriesStatus> {
  public executionContext: ExecutionContext;
  public repositories: Repositories<Statuses>;

  constructor(input: AppContextInput<Statuses>) {
    this.executionContext = new ExecutionContext(input.executionContextInput);
    this.repositories = input.repositories;
  }
}
