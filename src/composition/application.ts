import {
  AppContext,
  type AppContextInput,
  type RepositoriesExtra,
  type RepositoriesStatus,
} from '../core/context/app.context.ts';
import type { AuthType } from '../core/entities/auth/application/auth.authorize.ts';
import { ActorComposition } from './modules/actor.composition.ts';
import { AuthComposition } from './modules/auth.composition.ts';
import { MembershipComposition } from './modules/membership.composition.ts';
import { OrganizationComposition } from './modules/organization.composition.ts';

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

export class Application<
  TokenOutput,
  Statuses extends RepositoriesStatus,
  Extras extends RepositoriesExtra = RepositoriesExtra,
  AuthenticationType extends AuthType = 'LOGIN',
  CustomAuth = Record<string, unknown>,
> {
  readonly context: AppContext<
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
  readonly actor: ActorComposition<Statuses['actors'], Extras['actors']>;
  readonly organization: OrganizationComposition<Statuses['organizations'], Extras['organizations']>;
  readonly membership: MembershipComposition<Statuses['memberships'], Extras['memberships']>;

  constructor(
    input: ApplicationInput<
      TokenOutput,
      Statuses,
      Extras,
      AuthenticationType,
      CustomAuth
    >,
  ) {
    this.context = new AppContext<
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
      executionContext: this.context.executionContext,
      actorRepositoryPort: input.repositories.actors,
      membershipRepository: input.repositories.memberships,
      authentication: input.authentication,
    });

    this.actor = new ActorComposition({
      executionContext: this.context.executionContext,
      actorRepository: input.repositories.actors,
      policy: {
        actorStatusPolicy: input.policy.actor.actorStatusPolicy
      }
    });

    this.organization = new OrganizationComposition({
      executionContext: this.context.executionContext,
      organizationRepository: input.repositories.organizations,
      actorValidationQuery: this.actor.validationQuery,
      policy: {
        organizationStatusPolicy: input.policy.organization.organizationStatusPolicy
      }
    });

    this.membership = new MembershipComposition({
      executionContext: this.context.executionContext,
      membershipRepository: input.repositories.memberships,
      actorValidationQuery: this.actor.validationQuery,
      organizationValidationQuery: this.organization.validationQuery
    });
  }
}
