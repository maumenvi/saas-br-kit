import {
  CreateUserUseCase,
  type ExecutionContext,
  type UserRepositoryPort
} from "../../core/index.ts";

export type UserCompositionInput = {
  executionContext: ExecutionContext;
  userRepository: UserRepositoryPort;
}

export class UserComposition {
  readonly create: CreateUserUseCase;

  constructor(input: UserCompositionInput) {
    this.create = new CreateUserUseCase(
      input.executionContext,
      input.userRepository
    )
  }
}
