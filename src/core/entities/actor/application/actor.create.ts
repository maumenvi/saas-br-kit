import type { ActorRepositoryPort } from '../actor.repositories.ts';
import type { Actor } from '../actor.ts';
import type { ExecutionContext } from '../../../context/execution.context.ts';

export class CreateActorUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly actorRepository: ActorRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    actorRepository: ActorRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.actorRepository = actorRepository;
  }

  async execute(actor: Actor<Status, Extra>): Promise<void> {
    if (actor.type === 'USER') {
      actor.email.validate();
      actor.telephone.validate();
    }

    await this.executionContext.databaseProvider.run(async () => {
      await this.actorRepository.save(actor);
    });
  }
}
