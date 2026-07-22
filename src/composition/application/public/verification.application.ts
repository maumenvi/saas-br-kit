import { VerificationComposition } from '../../modules/verification/verification.composition.ts';
import type { VerificationCompositionInput } from '../../modules/verification/verification.composition.input.ts';

export type VerificationApplication<
  ActorStatus,
  MembershipStatus,
  ActorExtra = unknown,
  MembershipExtra = unknown,
> = Pick<
  VerificationComposition<
    ActorStatus,
    MembershipStatus,
    ActorExtra,
    MembershipExtra
  >,
  'accept' | 'expirePending'
>;

export function createVerificationApplication<
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
): VerificationApplication<
  ActorStatus,
  MembershipStatus,
  ActorExtra,
  MembershipExtra
> {
  const composition = new VerificationComposition(input);
  return Object.freeze({
    accept: composition.accept,
    expirePending: composition.expirePending,
  });
}
