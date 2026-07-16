import type { UserRepositoryPort } from "../user.repositories.ts";
import type { User } from "../user.ts";
import type { ExecutionContext } from '../../../context/execution.context.ts';

export class FindUserByIdUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly userRepository: UserRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    userRepository: UserRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.userRepository = userRepository;
  }

  async findById(id: string): Promise<User<Status, Extra> | null> {
    return await this.executionContext.databaseProvider.run(async () => {
      return await this.userRepository.findById(id);
    });
  }

  async findByEmail(email: string): Promise<User<Status, Extra> | null> {
    return await this.executionContext.databaseProvider.run(async () => {
      return await this.userRepository.findByEmail(email);
    });
  }

  async findByTelephone(telephone: string): Promise<User<Status, Extra> | null> {
    return await this.executionContext.databaseProvider.run(async () => {
      return await this.userRepository.findByTelephone(telephone);
    });
  }

  async findByName(name: string): Promise<User<Status, Extra>[]> {
    return await this.executionContext.databaseProvider.run(async () => {
      return await this.userRepository.findByName(name);
    });
  }
}
