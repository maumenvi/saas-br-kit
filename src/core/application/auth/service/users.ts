import type { User } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { applicationFailureFactory } from "../../shared/index.ts";
import type { AuthAppContext } from "../types.ts";

/**
 * Loads users for auth flows and enforces active-account requirements.
 */
export class ActiveUserLoader {
  private readonly appContext: AuthAppContext;

  /** Stores the auth repository collection used by this loader. */
  constructor(appContext: AuthAppContext) {
    this.appContext = appContext;
  }

  /**
   * Returns an active user or a normalized authorization/not-found failure.
   */
  async load(userId: string): Promise<Result<User, CoreError>> {
    const user = await this.appContext.auth.users.findById(userId);

    if (user === null) {
      return applicationFailureFactory.notFound(
        "auth.user_not_found",
        "Authenticated user was not found.",
      );
    }

    if (user.status !== "active") {
      return applicationFailureFactory.authorization(
        "auth.user_disabled",
        "Authenticated user is disabled.",
      );
    }

    return ok(user);
  }
}
