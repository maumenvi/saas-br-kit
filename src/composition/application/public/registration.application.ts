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
  | 'createOrganization'
  | 'sendOrganizationWelcomeEmail'
  | 'requestEmailConfirmation'
  | 'requestTelephoneConfirmation'
  | 'sendEmailConfirmation'
  | 'sendTelephoneConfirmation'
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

  return Object.freeze({
    createOrganization: composition.createOrganization,
    sendOrganizationWelcomeEmail: composition.sendOrganizationWelcomeEmail,
    requestEmailConfirmation: composition.requestEmailConfirmation,
    requestTelephoneConfirmation: composition.requestTelephoneConfirmation,
    sendEmailConfirmation: composition.sendEmailConfirmation,
    sendTelephoneConfirmation: composition.sendTelephoneConfirmation,
  });
}
