import {
  AppContext,
  type AppContextInput,
  type RepositoriesExtra,
  type RepositoriesStatus,
} from '../core/context/app.context.ts';
import type { AuthType } from '../core/entities/auth/application/auth.authorize.ts';
import type { Membership } from '../core/entities/membership/membership.ts';
import { ActorComposition } from './modules/actor.composition.ts';
import { AuthComposition } from './modules/auth.composition.ts';
import { MembershipComposition } from './modules/membership.composition.ts';
import { OrganizationComposition } from './modules/organization.composition.ts';
import { TenantComposition } from './modules/tenant.composition.ts';

export type ApplicationInput<
  TokenOutput,
  Statuses extends RepositoriesStatus,
  Extras extends RepositoriesExtra = RepositoriesExtra,
  AuthenticationType extends AuthType = 'LOGIN',
  CustomAuth = Record<string, unknown>,
> = AppContextInput<
  Statuses,
  Extras,
  TokenOutput,
  AuthenticationType,
  CustomAuth
>;

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

export type TenantApplication<OrganizationStatus> = Pick<
  TenantComposition<OrganizationStatus>,
  'resolve'
>;

export class Application<
  TokenOutput,
  Statuses extends RepositoriesStatus,
  Extras extends RepositoriesExtra = RepositoriesExtra,
  AuthenticationType extends AuthType = 'LOGIN',
  CustomAuth = Record<string, unknown>,
> {
  readonly #context: AppContext<
    Statuses,
    Extras,
    TokenOutput,
    AuthenticationType,
    CustomAuth
  >;
  readonly auth: AuthComposition<
    TokenOutput,
    AuthenticationType,
    CustomAuth,
    Statuses['memberships'],
    Extras['memberships']
  >;
  readonly tenant: TenantApplication<Statuses['organizations']>;
  readonly #input: ApplicationInput<
    TokenOutput,
    Statuses,
    Extras,
    AuthenticationType,
    CustomAuth
  >;

  constructor(
    input: ApplicationInput<
      TokenOutput,
      Statuses,
      Extras,
      AuthenticationType,
      CustomAuth
    >,
  ) {

    this.#input = Object.freeze({
      ...input,
      repositories: Object.freeze({ ...input.repositories }),
      policy: Object.freeze({
        actor: Object.freeze({ ...input.policy.actor }),
        organization: Object.freeze({ ...input.policy.organization }),
      }),
    });

    this.#context = new AppContext<
      Statuses,
      Extras,
      TokenOutput,
      AuthenticationType,
      CustomAuth
    >(input);

    this.auth = new AuthComposition<
      TokenOutput,
      AuthenticationType,
      CustomAuth,
      Statuses['memberships'],
      Extras['memberships']
    >({
      executionContext: this.#context.executionContext,
      actorRepositoryPort: this.#input.repositories.actors,
      membershipRepository: this.#input.repositories.memberships,
      authentication: this.#input.authentication,
    });

    const tenant = new TenantComposition({
      executionContext: this.#context.executionContext,
      organizationRepository: this.#input.repositories.organizations,
      policy: {
        organizationStatusPolicy: this.#input.policy.organization.organizationStatusPolicy,
        organizationSlugPolicy: this.#input.policy.organization.organizationSlugPolicy,
      },
    });
    this.tenant = Object.freeze({ resolve: tenant.resolve });
  }

  withPermission(
    membership: Membership<Statuses['memberships'], Extras['memberships']>,
  ): PermissionApplication<Statuses, Extras> {
    const actor = new ActorComposition({
      executionContext: this.#context.executionContext,
      actorRepository: this.#input.repositories.actors,
      policy: {
        actorStatusPolicy: this.#input.policy.actor.actorStatusPolicy,
      },
      permissionContext: membership,
    });

    const organization = new OrganizationComposition({
      executionContext: this.#context.executionContext,
      organizationRepository: this.#input.repositories.organizations,
      actorValidationQuery: actor.validationQuery,
      policy: {
        organizationStatusPolicy:
          this.#input.policy.organization.organizationStatusPolicy,
        organizationSlugPolicy:
          this.#input.policy.organization.organizationSlugPolicy,
      },
      permissionContext: membership,
    });

    const membershipComposition = new MembershipComposition({
      executionContext: this.#context.executionContext,
      membershipRepository: this.#input.repositories.memberships,
      actorValidationQuery: actor.validationQuery,
      organizationValidationQuery: organization.validationQuery,
      permissionContext: membership,
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
        create: membershipComposition.create,
        update: membershipComposition.update,
        changeStatus: membershipComposition.changeStatus,
        findById: membershipComposition.findById,
        findByOrganizationId: membershipComposition.findByOrganizationId,
        findByActorId: membershipComposition.findByActorId,
      }),
    });
  }
}
