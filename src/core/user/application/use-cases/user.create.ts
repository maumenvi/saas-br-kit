import { ExecutionContext } from "../../../context/execution.context.ts";
import type { UserRepositoryPort } from "../../../ports/repositories/user.repositories.ts";
import type { User } from "../input/user.input.ts";

export class CreateUserUseCase {
  private readonly executionContext: ExecutionContext;
  private readonly userRepository: UserRepositoryPort;

  constructor(
    executionContext: ExecutionContext,
    userRepository: UserRepositoryPort
  ) {
    this.executionContext = executionContext;
    this.userRepository = userRepository;
  }

  async execute(user: User): Promise<void> {
    user.email.validate();
    user.telephone.validate();

    await this.executionContext.databaseProvider.run(async () => {
      await this.userRepository.save(user);
    });
  }
}
