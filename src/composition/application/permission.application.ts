import type {
  Repositories,
  RepositoriesExtra,
  RepositoriesStatus,
} from '../../core/context/app.context.ts';
import type { ExecutionContext } from '../../core/context/execution.context.ts';
import type { ActorStatusPolicyPort } from '../../core/entities/actor/policies/actor.status.police.ts';
import type { Membership } from '../../core/entities/membership/membership.ts';
import type { OrganizationSlugPolicyPort } from '../../core/entities/organization/policies/organization.slug.policy.ts';
import type { OrganizationStatusPolicyPort } from '../../core/entities/organization/policies/organizations.status.police.ts';
import { ActorComposition } from '../modules/actor/actor.composition.ts';
import { MembershipComposition } from '../modules/membership/membership.composition.ts';
import { OrganizationComposition } from '../modules/organization/organization.composition.ts';

export type ActorPermissionApplication<Status, Extra = unknown> = Pick<
  ActorComposition<Status, Extra>,
  | 'create'
  | 'update'
  | 'changeStatus'
  | 'findById'
  | 'findByEmail'
  | 'findByTelephone'
  | 'findByName'
>;

export type OrganizationPermissionApplication<Status, Extra = unknown> = Pick<
  OrganizationComposition<Status, Extra>,
  | 'create'
  | 'update'
  | 'changeStatus'
  | 'findById'
  | 'findByCnpj'
>;

export type MembershipPermissionApplication<Status, Extra = unknown> = Pick<
  MembershipComposition<Status, Extra>,
  | 'create'
  | 'update'
  | 'changeStatus'
  | 'findById'
  | 'findByOrganizationId'
  | 'findByActorId'
>;

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
}>;

type PermissionApplicationInput<
  Statuses extends RepositoriesStatus,
  Extras extends RepositoriesExtra,
> = {
  executionContext: ExecutionContext;
  membership: Membership<Statuses['memberships'], Extras['memberships']>;
  policy: {
    actor: {
      actorStatusPolicy: ActorStatusPolicyPort<Statuses['actors']>;
    };
    organization: {
      organizationStatusPolicy: OrganizationStatusPolicyPort<
        Statuses['organizations']
      >;
      organizationSlugPolicy: OrganizationSlugPolicyPort;
    };
  };
  repositories: Repositories<Statuses, Extras>;
};

export function createPermissionApplication<
  Statuses extends RepositoriesStatus,
  Extras extends RepositoriesExtra,
>(
  input: PermissionApplicationInput<Statuses, Extras>,
): PermissionApplication<Statuses, Extras> {
  const actor = new ActorComposition({
    executionContext: input.executionContext,
    actorRepository: input.repositories.actors,
    auditRepository: input.repositories.audits,
    policy: {
      actorStatusPolicy: input.policy.actor.actorStatusPolicy,
    },
    permissionContext: input.membership,
  });

  const organization = new OrganizationComposition({
    executionContext: input.executionContext,
    organizationRepository: input.repositories.organizations,
    auditRepository: input.repositories.audits,
    actorValidationQuery: actor.validationQuery,
    policy: {
      organizationStatusPolicy:
        input.policy.organization.organizationStatusPolicy,
      organizationSlugPolicy:
        input.policy.organization.organizationSlugPolicy,
    },
    permissionContext: input.membership,
  });

  const membership = new MembershipComposition({
    executionContext: input.executionContext,
    membershipRepository: input.repositories.memberships,
    auditRepository: input.repositories.audits,
    actorValidationQuery: actor.validationQuery,
    organizationValidationQuery: organization.validationQuery,
    permissionContext: input.membership,
  });

  return Object.freeze({
    actor: Object.freeze({
      create: actor.create,
      update: actor.update,
      changeStatus: actor.changeStatus,
      findById: actor.findById,
      findByEmail: actor.findByEmail,
      findByTelephone: actor.findByTelephone,
      findByName: actor.findByName,
    }),
    organization: Object.freeze({
      create: organization.create,
      update: organization.update,
      changeStatus: organization.changeStatus,
      findById: organization.findById,
      findByCnpj: organization.findByCnpj,
    }),
    membership: Object.freeze({
      create: membership.create,
      update: membership.update,
      changeStatus: membership.changeStatus,
      findById: membership.findById,
      findByOrganizationId: membership.findByOrganizationId,
      findByActorId: membership.findByActorId,
    }),
  });
}
