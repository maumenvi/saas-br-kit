import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { UserRepositoryPort } from "../user.repositories.ts";
import type { User } from "../user.ts";

export class ChangeUserStatusUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly userRepository: UserRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    userRepository: UserRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.userRepository = userRepository;
  }

  async changeStatus(user: User<Status, Extra>): Promise<void> {
    await this.executionContext.databaseProvider.run(async () => {
      await this.userRepository.changeStatus(user);
    });
  }
}
