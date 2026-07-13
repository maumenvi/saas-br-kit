import { ExecutionContext } from "../../../context/execution.context.ts";
import type { UserRepositoryPort } from "../../user.repositories.ts";
import type { User } from "../user.input.ts";

export class FindUserByIdUseCase<Status> {
  private readonly executionContext: ExecutionContext;
  private readonly userRepository: UserRepositoryPort<Status>;

  constructor(
    executionContext: ExecutionContext,
    userRepository: UserRepositoryPort<Status>
  ) {
    this.executionContext = executionContext;
    this.userRepository = userRepository;
  }

  async findById(id: string): Promise<User<Status> | null> {
    return await this.executionContext.databaseProvider.run(async () => {
      return await this.userRepository.findById(id);
    });
  }

  async findByEmail(email: string): Promise<User<Status> | null> {
    return await this.executionContext.databaseProvider.run(async () => {
      return await this.userRepository.findByEmail(email);
    });
  }

  async findByTelephone(telephone: string): Promise<User<Status> | null> {
    return await this.executionContext.databaseProvider.run(async () => {
      return await this.userRepository.findByTelephone(telephone);
    });
  }

  async findByName(name: string): Promise<User<Status>[]> {
    return await this.executionContext.databaseProvider.run(async () => {
      return await this.userRepository.findByName(name);
    });
  }
}
