import { FindActorUseCase } from '../../../core/entities/actor/application/actor.find.ts';
import type { Actor, UserActor } from '../../../core/entities/actor/actor.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { ActorCompositionInput } from './actor.composition.input.ts';

export function composeActorFindById<Status, Extra = unknown>(
  input: ActorCompositionInput<Status, Extra>,
): Handler<string, Actor<Status, Extra> | null> {
  const useCase = new FindActorUseCase(
    input.executionContext,
    input.actorRepository,
  );

  return withDefaultInterceptors(useCase.findById.bind(useCase), {
    action: 'actor:find-by-id',
    permission: 'actor:find',
    ...input,
  });
}

export function composeActorFindByEmail<Status, Extra = unknown>(
  input: ActorCompositionInput<Status, Extra>,
): Handler<string, UserActor<Status, Extra> | null> {
  const useCase = new FindActorUseCase(
    input.executionContext,
    input.actorRepository,
  );

  return withDefaultInterceptors(useCase.findByEmail.bind(useCase), {
    action: 'actor:find-by-email',
    permission: 'actor:find',
    ...input,
  });
}

export function composeActorFindByTelephone<Status, Extra = unknown>(
  input: ActorCompositionInput<Status, Extra>,
): Handler<string, UserActor<Status, Extra> | null> {
  const useCase = new FindActorUseCase(
    input.executionContext,
    input.actorRepository,
  );

  return withDefaultInterceptors(useCase.findByTelephone.bind(useCase), {
    action: 'actor:find-by-telephone',
    permission: 'actor:find',
    ...input,
  });
}

export function composeActorFindByName<Status, Extra = unknown>(
  input: ActorCompositionInput<Status, Extra>,
): Handler<string, Actor<Status, Extra>[]> {
  const useCase = new FindActorUseCase(
    input.executionContext,
    input.actorRepository,
  );

  return withDefaultInterceptors(useCase.findByName.bind(useCase), {
    action: 'actor:find-by-name',
    permission: 'actor:find',
    ...input,
  });
}
