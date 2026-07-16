import {
  AppContext,
  type AppContextInput,
  type RepositoriesExtra,
  type RepositoriesStatus,
} from "../core/context/app.context.ts";
import { MembershipComposition } from './modules/membership.composition.ts';
import { OrganizationComposition } from './modules/organization.composition.ts';
import { UserComposition } from './modules/user.composition.ts';

export class Application<Statuses extends RepositoriesStatus, Extras extends RepositoriesExtra = RepositoriesExtra> {
  readonly context: AppContext<Statuses, Extras>;
  readonly user: UserComposition<Statuses['users'], Extras['users']>;
  readonly organization: OrganizationComposition<Statuses['organizations'], Extras['organizations']>;
  readonly membership: MembershipComposition<Statuses['memberships'], Extras['memberships']>;

  constructor(input: AppContextInput<Statuses, Extras>) {
    this.context = new AppContext<Statuses, Extras>(input);


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
