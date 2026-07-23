import type { UserActor } from '../../actor/actor.ts';
import type { Membership } from '../../membership/membership.ts';
import type { Organization } from '../organization.ts';

export type OrganizationRegistrationInput<
  ActorStatus,
  OrganizationStatus,
  MembershipStatus,
  ActorExtra = unknown,
  OrganizationExtra = unknown,
  MembershipExtra = unknown,
> = Readonly<{
  user: Omit<
    UserActor<ActorStatus, ActorExtra>,
    'type' | 'passwordHash' | 'emailVerified' | 'telephoneVerified'
  > & {
    password: string;
  };
  organization: Omit<
    Organization<OrganizationStatus, OrganizationExtra>,
    'ownerActorId'
  >;
  membership: Omit<
    Membership<MembershipStatus, MembershipExtra>,
    'actorId' | 'organizationId' | 'role' | 'permissions'
  >;
}>;

export type OrganizationRegistrationOutput = Readonly<{
  actorId: string;
  organizationId: string;
  membershipId: string;
}>;
