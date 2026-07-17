import {
  AppContext,
  type AppContextInput,
  type RepositoriesExtra,
  type RepositoriesStatus,
} from '../core/context/app.context.ts';
import { AuthComposition } from './modules/auth.composition.ts';
import { MembershipComposition } from './modules/membership.composition.ts';
import { OrganizationComposition } from './modules/organization.composition.ts';
import { UserComposition } from './modules/user.composition.ts';

export type ApplicationInput<
  Statuses extends RepositoriesStatus,
  TokenOutput,
  Extras extends RepositoriesExtra = RepositoriesExtra,
> = AppContextInput<Statuses, Extras, TokenOutput>

export class Application<
  Statuses extends RepositoriesStatus,
  TokenOutput = unknown,
  Extras extends RepositoriesExtra = RepositoriesExtra,
> {
  readonly context: AppContext<Statuses, Extras, TokenOutput>;
  readonly auth: AuthComposition<TokenOutput>;
  readonly user: UserComposition<Statuses['users'], Extras['users']>;
  readonly organization: OrganizationComposition<Statuses['organizations'], Extras['organizations']>;
  readonly membership: MembershipComposition<Statuses['memberships'], Extras['memberships']>;

  constructor(input: ApplicationInput<Statuses, TokenOutput, Extras>) {
    this.context = new AppContext<Statuses, Extras, TokenOutput>(input);

    this.auth = new AuthComposition<TokenOutput>({
      executionContext: this.context.executionContext,
      userRepositoryPort: input.repositories.users,
      tokenPort: input.authentication.tokenPort,
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
