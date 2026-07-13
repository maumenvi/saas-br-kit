import {
  CreateUserUseCase,
  type ExecutionContext,
  type UserRepositoryPort
} from "../../core/index.ts";
import { type OrganizationRepositoryPort } from "../../core/organization/organization.repositories.ts";

export type UserCompositionInput<UsersStatus, OrganizationsStatus> = {
  executionContext: ExecutionContext;
  userRepository: UserRepositoryPort<UsersStatus>;
  organizationRepository: OrganizationRepositoryPort<OrganizationsStatus>;
}

export class UserComposition<UsersStatus, OrganizationsStatus> {
  readonly create: CreateUserUseCase<UsersStatus>;

  constructor(input: UserCompositionInput<UsersStatus, OrganizationsStatus>) {
    this.create = new CreateUserUseCase(
      input.executionContext,
      input.userRepository
    )
  }
}
