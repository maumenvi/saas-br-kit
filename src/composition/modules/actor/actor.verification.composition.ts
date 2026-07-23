import {
  ActorVerificationUseCase,
  type ActorVerificationInput,
} from '../../../core/entities/actor/application/actor.verification.ts';
import type { RequestVerificationOutput } from '../../../core/entities/verification/application/verification.request.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { ActorCompositionInput } from './actor.composition.input.ts';

export function composeActorRequestEmailConfirmation<
  ActorStatus,
  MembershipStatus,
  ActorExtra = unknown,
  MembershipExtra = unknown,
>(
  input: ActorCompositionInput<ActorStatus, ActorExtra, MembershipStatus, MembershipExtra>,
): Handler<ActorVerificationInput, RequestVerificationOutput> {
  const useCase = new ActorVerificationUseCase({
    executionContext: input.executionContext,
    actorRepository: input.actorRepository,
    verificationRepository: input.verificationRepository,
    config: input.verification,
  });
  return withDefaultInterceptors(
    useCase.requestEmailConfirmation.bind(useCase),
    {
      action: 'actor:request-email-confirmation',
      permission: 'actor:update',
      idempotent: false,
      ...input,
    },
  );
}

export function composeActorRequestTelephoneConfirmation<
  ActorStatus,
  MembershipStatus,
  ActorExtra = unknown,
  MembershipExtra = unknown,
>(
  input: ActorCompositionInput<ActorStatus, ActorExtra, MembershipStatus, MembershipExtra>,
): Handler<ActorVerificationInput, RequestVerificationOutput> {
  const useCase = new ActorVerificationUseCase({
    executionContext: input.executionContext,
    actorRepository: input.actorRepository,
    verificationRepository: input.verificationRepository,
    config: input.verification,
  });
  return withDefaultInterceptors(
    useCase.requestTelephoneConfirmation.bind(useCase),
    {
      action: 'actor:request-telephone-confirmation',
      permission: 'actor:update',
      idempotent: false,
      ...input,
    },
  );
}
