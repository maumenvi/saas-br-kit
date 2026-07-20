import type { ActorRepositoryPort } from '../actor.repositories.ts';
import type { Actor, UserActor } from '../actor.ts';
import type { ExecutionContext } from '../../../context/execution.context.ts';

export class FindActorUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly actorRepository: ActorRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    actorRepository: ActorRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.actorRepository = actorRepository;
  }

  async findById(id: string): Promise<Actor<Status, Extra> | null> {
    return await this.executionContext.databaseProvider.run(async () => {
      return await this.actorRepository.findById(id);
    });
  }

  async findByEmail(email: string): Promise<UserActor<Status, Extra> | null> {
    return await this.executionContext.databaseProvider.run(async () => {
      return await this.actorRepository.findByEmail(email);
    });
  }

  async findByTelephone(telephone: string): Promise<UserActor<Status, Extra> | null> {
    return await this.executionContext.databaseProvider.run(async () => {
      return await this.actorRepository.findByTelephone(telephone);
    });
  }

  async findByName(name: string): Promise<Actor<Status, Extra>[]> {
    return await this.executionContext.databaseProvider.run(async () => {
      return await this.actorRepository.findByName(name);
    });
  }
}
