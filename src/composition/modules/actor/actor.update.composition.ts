import { UpdateActorUseCase } from '../../../core/entities/actor/application/actor.update.ts';
import type { Actor } from '../../../core/entities/actor/actor.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { ActorCompositionInput } from './actor.composition.input.ts';

export function composeActorUpdate<Status, Extra = unknown>(
  input: ActorCompositionInput<Status, Extra>,
): Handler<Actor<Status, Extra>, void> {
  const useCase = new UpdateActorUseCase(
    input.executionContext,
    input.actorRepository,
  );

  return withDefaultInterceptors(useCase.update.bind(useCase), {
    action: 'actor:update',
    permission: 'actor:update',
    ...input,
  });
}
