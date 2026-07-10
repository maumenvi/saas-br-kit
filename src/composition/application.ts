import {
  AppContext,
  type AppContextInput,
  type UserRepositoryPort
} from "../core/index.ts";
import { UserComposition } from "./modules/user.composition.ts";

export type AplicationInput = {
  context: AppContextInput;
  repositories: {
    user: UserRepositoryPort;
  }
}

export class Aplication {
  readonly context: AppContext;
  readonly user: UserComposition;

  constructor(input: AplicationInput) {
    this.context = new AppContext(input.context);
    this.user = new UserComposition({
      executionContext: this.context.executionContext,
      userRepository: input.repositories.user
    });
  }
}
