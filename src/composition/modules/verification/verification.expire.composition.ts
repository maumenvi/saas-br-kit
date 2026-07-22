import { ExpireVerificationsUseCase } from '../../../core/entities/verification/application/verification.expire.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { VerificationCompositionInput } from './verification.composition.input.ts';

export function composeVerificationExpirePending<
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
): Handler<void, number> {
  const useCase = new ExpireVerificationsUseCase(
    input.executionContext,
    input.verificationRepository,
  );
  return withDefaultInterceptors(useCase.execute.bind(useCase), {
    action: 'verification:expire-pending',
    idempotent: false,
    ...input,
  });
}
