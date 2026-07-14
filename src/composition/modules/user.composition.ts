import type { ExecutionContext } from "../../core/context/execution.context.ts";
import { CreateUserUseCase } from "../../core/user/application/use-cases/user.create.ts";
import type { UserRepositoryPort } from "../../core/user/user.repositories.ts";

export type UserCompositionInput<UsersStatus> = {
  executionContext: ExecutionContext;
  userRepository: UserRepositoryPort<UsersStatus>;
}

export class UserComposition<UsersStatus> {
  readonly create: CreateUserUseCase<UsersStatus>;

  constructor(input: UserCompositionInput<UsersStatus>) {
    this.create = new CreateUserUseCase(
      input.executionContext,
      input.userRepository
    )
  }
}
