import type { ExecutionContext } from "../../../context/execution-context.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { applicationFailureFactory, useCaseRunner } from "../../shared/index.ts";
import { ActiveUserLoader } from "../service/users.ts";
import type { AuthAppContext, AuthenticatedProfile } from "../types.ts";

/**
 * Returns the active profile represented by a user execution context.
 */
export class GetAuthenticatedProfileUseCase {
  private readonly appContext: AuthAppContext;

  /** Stores auth repositories used to load the current user. */
  constructor(appContext: AuthAppContext) {
    this.appContext = appContext;
  }

  /**
   * Executes the profile lookup for the actor in the execution context.
   */
  async execute(
    executionContext: ExecutionContext,
  ): Promise<Result<AuthenticatedProfile, CoreError>> {
    if (executionContext.actor.type !== "user") {
      return applicationFailureFactory.authorization(
        "auth.user_actor_required",
        "Authenticated profile requires a user actor.",
      );
    }
    const actorUserId = executionContext.actor.id;
    const userLoader = new ActiveUserLoader(this.appContext);

    return useCaseRunner.runSafely(async () => {
      const user = await userLoader.load(actorUserId);
      if (!user.ok) {
        return user;
      }

      return ok({ user: user.data });
    });
  }
}
