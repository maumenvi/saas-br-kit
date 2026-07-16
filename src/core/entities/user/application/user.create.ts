import type { UserRepositoryPort } from "../user.repositories.ts";
import type { User } from "../user.ts";
import type { ExecutionContext } from '../../../context/execution.context.ts';

export class CreateUserUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly userRepository: UserRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    userRepository: UserRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.userRepository = userRepository;
  }

  async execute(user: User<Status, Extra>): Promise<void> {
    user.email.validate();
    user.telephone.validate();

    await this.executionContext.databaseProvider.run(async () => {
      await this.userRepository.save(user);
    });
  }
}
