import {
  AcceptVerificationUseCase,
  type AcceptVerificationInput,
  type AcceptVerificationOutput,
} from '../../../core/entities/verification/application/verification.accept.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { VerificationCompositionInput } from './verification.composition.input.ts';

export function composeVerificationAccept<
  ActorStatus,
  MembershipStatus,
  ActorExtra = unknown,
  MembershipExtra = unknown,
>(
  input: VerificationCompositionInput<
    ActorStatus,
    MembershipStatus,
    ActorExtra,
    MembershipExtra
  >,
): Handler<AcceptVerificationInput, AcceptVerificationOutput> {
  const useCase = new AcceptVerificationUseCase({
    executionContext: input.executionContext,
    actorRepository: input.actorRepository,
    membershipRepository: input.membershipRepository,
    verificationRepository: input.verificationRepository,
    config: input.verification,
  });
  return withDefaultInterceptors(useCase.execute.bind(useCase), {
    action: 'verification:accept',
    idempotent: false,
    ...input,
    identityResolver: (_request, output) => ({
      actorId: output?.actorId ?? null,
      organizationId: output?.organizationId ?? null,
    }),
  });
}
