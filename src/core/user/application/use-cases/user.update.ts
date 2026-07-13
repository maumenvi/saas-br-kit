import { ExecutionContext } from "../../../context/execution.context.ts";
import type { UserRepositoryPort } from "../../user.repositories.ts";
import type { User } from "../user.input.ts";

export class UpdateUserUseCase<Status> {
  private readonly executionContext: ExecutionContext;
  private readonly userRepository: UserRepositoryPort<Status>;

  constructor(
    executionContext: ExecutionContext,
    userRepository: UserRepositoryPort<Status>
  ) {
    this.executionContext = executionContext;
    this.userRepository = userRepository;
  }

  async update(user: User<Status>): Promise<void> {
    user.email.validate();
    user.telephone.validate();

    await this.executionContext.databaseProvider.run(async () => {
      await this.userRepository.update(user);
    });
  }
}
