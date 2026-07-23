import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { ActorRepositoryPort } from '../actor.repositories.ts';
import type { Actor } from '../actor.ts';

export class ChangeActorStatusUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly actorRepository: ActorRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    actorRepository: ActorRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.actorRepository = actorRepository;
  }

  async changeStatus(actor: Actor<Status, Extra>): Promise<void> {
    await this.executionContext.databaseProvider.run(async () => {
      await this.actorRepository.changeStatus(actor);
    });
  }
}
