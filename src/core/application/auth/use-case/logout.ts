import type { ExecutionContext } from "../../../context/execution-context.ts";
import { refreshTokenSessionTransitions } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { useCaseRunner } from "../../shared/index.ts";
import { AuthSessionService } from "../service/sessions.ts";
import type { AuthAppContext, LogoutInput, LogoutResult } from "../types.ts";

/**
 * Revokes an opaque refresh token without exposing the raw secret in logs.
 */
export class LogoutUseCase {
  private readonly appContext: AuthAppContext;

  /** Stores auth ports and shared application services. */
  constructor(appContext: AuthAppContext) {
    this.appContext = appContext;
  }

  /**
   * Executes logout and returns whether a persisted session was revoked.
   */
  async execute(
    executionContext: ExecutionContext,
    input: LogoutInput,
  ): Promise<Result<LogoutResult, CoreError>> {
    const sessionService = new AuthSessionService(this.appContext);

    return useCaseRunner.runSafely(async () =>
      this.appContext.transactionManager.runInTransaction(async () => {
        const session = await sessionService.findRefreshSession(input.refreshToken);

        if (session === null) {
          return ok<LogoutResult>({ loggedOut: false });
        }

        const revoked = refreshTokenSessionTransitions.revoke(session, {
          revokedAt: this.appContext.clock.now().toISOString(),
          reason: "logout",
        });
        if (!revoked.ok) {
          return revoked;
        }

        await this.appContext.auth.refreshTokens.save(revoked.data);
        this.appContext.logger.info("User logged out.", {
          requestId: executionContext.requestId,
          userId: session.userId,
          refreshTokenSessionId: session.id,
        });

        return ok<LogoutResult>({ loggedOut: true });
      }),
    );
  }
}
