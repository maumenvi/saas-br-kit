import {
  AppContext,
  type AppContextInput,
} from "../core/index.ts";
import { UserComposition } from "./modules/user.composition.ts";

export class Aplication {
  readonly context: AppContext;
  readonly user: UserComposition;

  constructor(input: AppContextInput) {
    this.context = new AppContext(input);
    this.user = new UserComposition({
      executionContext: this.context.executionContext,
      userRepository: input.repositories.users
    });
  }
}
