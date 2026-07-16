import {
  AppContext,
  type AppContextInput,
  type RepositoriesExtra,
  type RepositoriesStatus,
} from "../core/context/app.context.ts";
import { UserDataValidationService } from '../core/entities/user/services/user.data.validation.service.ts';
import { OrganizationComposition } from './modules/organization.composition.ts';
import { UserComposition } from './modules/user.composition.ts';

export class Application<Statuses extends RepositoriesStatus, Extras extends RepositoriesExtra = RepositoriesExtra> {
  readonly context: AppContext<Statuses, Extras>;
  readonly user: UserComposition<Statuses['users'], Extras['users']>;
  readonly organization: OrganizationComposition<Statuses['organizations'], Extras['organizations']>;

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
      userValidationQuery: new UserDataValidationService<Statuses['users']>(input.repositories.users, input.policy.user.userStatusPolicy)
    });
  }
}