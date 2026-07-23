import { ChangeActorStatusUseCase } from '../../../core/entities/actor/application/actor.change.status.ts';
import type { Actor } from '../../../core/entities/actor/actor.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { ActorCompositionInput } from './actor.composition.input.ts';

export function composeActorChangeStatus<Status, Extra = unknown>(
  input: ActorCompositionInput<Status, Extra>,
): Handler<Actor<Status, Extra>, void> {
  const useCase = new ChangeActorStatusUseCase(
    input.executionContext,
    input.actorRepository,
  );

  return withDefaultInterceptors(useCase.changeStatus.bind(useCase), {
    action: 'actor:change-status',
    permission: 'actor:change-status',
    ...input,
  });
}
