import {
  AppContext,
  type AppContextInput,
  type RepositoriesStatus,
} from "../core/context/app.context.ts";
import { OrganizationComposition } from './modules/organization.composition.ts';
import { UserComposition } from './modules/user.composition.ts';

export class Aplication<Statuses extends RepositoriesStatus> {
  readonly context: AppContext<Statuses>;
  readonly user: UserComposition<Statuses['users']>;
  readonly organization: OrganizationComposition<Statuses['organizations']>;

  constructor(input: AppContextInput<Statuses>) {
    this.context = new AppContext(input);
    this.user = new UserComposition({
      executionContext: this.context.executionContext,
      userRepository: input.repositories.users
    });
    this.organization = new OrganizationComposition({
      executionContext: this.context.executionContext,
      organizationRepository: input.repositories.organizations
    });
  }
}
