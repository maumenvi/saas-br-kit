import { CreateActorUseCase } from '../../../core/entities/actor/application/actor.create.ts';
import type { Actor } from '../../../core/entities/actor/actor.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { ActorCompositionInput } from './actor.composition.input.ts';

export function composeActorCreate<Status, Extra = unknown>(
  input: ActorCompositionInput<Status, Extra>,
): Handler<Actor<Status, Extra>, void> {
  const useCase = new CreateActorUseCase(
    input.executionContext,
    input.actorRepository,
  );

  return withDefaultInterceptors(useCase.execute.bind(useCase), {
    action: 'actor:create',
    permission: 'actor:create',
    ...input,
  });
}
