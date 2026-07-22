import type {
  RepositoriesExtra,
  RepositoriesStatus,
} from '../../../core/context/app.context.ts';
import {
  createActorPermissionScope,
  type ActorPermissionApplication,
} from './actor.permission.application.ts';
import {
  createMembershipPermissionScope,
  type MembershipPermissionApplication,
} from './membership.permission.application.ts';
import {
  createMfaPermissionScope,
  type MfaPermissionApplication,
} from './mfa.permission.application.ts';
import {
  createOrganizationPermissionScope,
  type OrganizationPermissionApplication,
} from './organization.permission.application.ts';
import type { PermissionApplicationInput } from './permission.application.input.ts';

export type PermissionApplication<
  Statuses extends RepositoriesStatus,
  Extras extends RepositoriesExtra = RepositoriesExtra,
> = Readonly<{
  actor: ActorPermissionApplication<Statuses['actors'], Extras['actors']>;
  organization: OrganizationPermissionApplication<
    Statuses['organizations'],
    Extras['organizations']
  >;
  membership: MembershipPermissionApplication<
    Statuses['memberships'],
    Extras['memberships']
  >;
  mfa: MfaPermissionApplication<Statuses['actors'], Extras['actors']>;
}>;

export function createPermissionApplication<
  Statuses extends RepositoriesStatus,
  Extras extends RepositoriesExtra,
>(
  input: PermissionApplicationInput<Statuses, Extras>,
): PermissionApplication<Statuses, Extras> {
  const actor = createActorPermissionScope({
    executionContext: input.executionContext,
    actorRepository: input.repositories.actors,
    auditRepository: input.repositories.audits,
    actorStatusPolicy: input.policy.actor.actorStatusPolicy,
    permissionContext: input.membership,
  });

  const organization = createOrganizationPermissionScope({
    executionContext: input.executionContext,
    organizationRepository: input.repositories.organizations,
    auditRepository: input.repositories.audits,
    actorValidationQuery: actor.validationQuery,
    organizationStatusPolicy:
      input.policy.organization.organizationStatusPolicy,
    organizationSlugPolicy: input.policy.organization.organizationSlugPolicy,
    permissionContext: input.membership,
  });

  const membership = createMembershipPermissionScope({
    executionContext: input.executionContext,
    membershipRepository: input.repositories.memberships,
    auditRepository: input.repositories.audits,
    actorValidationQuery: actor.validationQuery,
    organizationValidationQuery: organization.validationQuery,
    permissionContext: input.membership,
  });

  const mfa = createMfaPermissionScope({
    executionContext: input.executionContext,
    auditRepository: input.repositories.audits,
    actorRepository: input.repositories.actors,
    actorStatusPolicy: input.policy.actor.actorStatusPolicy,
    mfaRepository: input.repositories.mfas,
    mfaProvider: input.mfa.provider,
    issuer: input.mfa.issuer,
    permissionContext: input.membership,
  });

  return Object.freeze({
    actor: actor.application,
    organization: organization.application,
    membership: membership.application,
    mfa,
  });
}
