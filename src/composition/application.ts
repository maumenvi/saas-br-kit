import {
  AppContext,
  type AppContextInput,
  type RepositoriesExtra,
  type RepositoriesStatus,
} from '../core/context/app.context.ts';
import type { AuthType } from '../core/entities/auth/application/auth.authorize.ts';
import { AuthComposition } from './modules/auth.composition.ts';
import { MembershipComposition } from './modules/membership.composition.ts';
import { OrganizationComposition } from './modules/organization.composition.ts';
import { UserComposition } from './modules/user.composition.ts';

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
  readonly auth: AuthComposition<TokenOutput, AuthenticationType, CustomAuth>;
  readonly user: UserComposition<Statuses['users'], Extras['users']>;
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
      CustomAuth
    >({
      executionContext: this.context.executionContext,
      userRepositoryPort: input.repositories.users,
      authentication: input.authentication,
    });

    this.user = new UserComposition({
      executionContext: this.context.executionContext,
      userRepository: input.repositories.users,
      policy: {
        userStatusPolicy: input.policy.user.userStatusPolicy
      }
    });

    this.organization = new OrganizationComposition({
      executionContext: this.context.executionContext,
      organizationRepository: input.repositories.organizations,
      userValidationQuery: this.user.validationQuery,
      policy: {
        organizationStatusPolicy: input.policy.organization.organizationStatusPolicy
      }
    });

    this.membership = new MembershipComposition({
      executionContext: this.context.executionContext,
      membershipRepository: input.repositories.memberships,
      userValidationQuery: this.user.validationQuery,
      organizationValidationQuery: this.organization.validationQuery
    });
  }
}
