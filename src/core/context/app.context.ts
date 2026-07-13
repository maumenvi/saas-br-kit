import { type OrganizationRepositoryPort } from "../organization/organization.repositories.ts";
import type { UserRepositoryPort } from "../user/user.repositories.ts";
import { ExecutionContext, type ExecutionContextInput } from "./execution.context.ts";

export type Repositories<UsersStatus, OrganizationsStatus> = {
  users: UserRepositoryPort<UsersStatus>;
  organizations: OrganizationRepositoryPort<OrganizationsStatus>;
}

export type AppContextInput<UsersStatus, OrganizationsStatus> = {
  executionContextInput: ExecutionContextInput;
  repositories: Repositories<UsersStatus, OrganizationsStatus>;
}

export class AppContext<UsersStatus, OrganizationsStatus> {
  public executionContext: ExecutionContext;
  public repositories: Repositories<UsersStatus, OrganizationsStatus>;

  constructor(input: AppContextInput<UsersStatus, OrganizationsStatus>) {
    this.executionContext = new ExecutionContext(input.executionContextInput);
    this.repositories = input.repositories;
  }
}
