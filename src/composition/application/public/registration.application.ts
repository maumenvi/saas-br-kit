import { RegistrationComposition } from '../../modules/registration/registration.composition.ts';
import type { RegistrationCompositionInput } from '../../modules/registration/registration.composition.input.ts';

export type RegistrationApplication<
  ActorStatus,
  OrganizationStatus,
  MembershipStatus,
  ActorExtra = unknown,
  OrganizationExtra = unknown,
  MembershipExtra = unknown,
> = Pick<
  RegistrationComposition<
    ActorStatus,
    OrganizationStatus,
    MembershipStatus,
    ActorExtra,
    OrganizationExtra,
    MembershipExtra
  >,
  'createOrganization'
>;

export function createRegistrationApplication<
  ActorStatus,
  OrganizationStatus,
  MembershipStatus,
  ActorExtra = unknown,
  OrganizationExtra = unknown,
  MembershipExtra = unknown,
>(
  input: RegistrationCompositionInput<
    ActorStatus,
    OrganizationStatus,
    MembershipStatus,
    ActorExtra,
    OrganizationExtra,
    MembershipExtra
  >,
): RegistrationApplication<
  ActorStatus,
  OrganizationStatus,
  MembershipStatus,
  ActorExtra,
  OrganizationExtra,
  MembershipExtra
> {
  const composition = new RegistrationComposition(input);

  return Object.freeze({ createOrganization: composition.createOrganization });
}
