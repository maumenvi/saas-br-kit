import type { ExecutionContext } from "../../../context/execution-context.ts";
import {
  type RefreshTokenSession,
  refreshTokenSessionPolicy,
  refreshTokenSessionTransitions,
} from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { useCaseRunner } from "../../shared/index.ts";
import { authFailures } from "../service/errors.ts";
import { AuthSessionService } from "../service/sessions.ts";
import { ActiveUserLoader } from "../service/users.ts";
import type { AuthAppContext, AuthResult, RefreshAuthTokenInput } from "../types.ts";

/**
 * Rotates active refresh tokens and issues a new auth result.
 */
export class RefreshAuthTokenUseCase {
  private readonly sessionService: AuthSessionService;
  private readonly userLoader: ActiveUserLoader;

  private readonly appContext: AuthAppContext;

  /** Stores auth ports and shared application services. */
  constructor(appContext: AuthAppContext) {
    this.appContext = appContext;
    this.sessionService = new AuthSessionService(appContext);
    this.userLoader = new ActiveUserLoader(appContext);
  }

  /**
   * Executes refresh-token rotation and detects reuse of rotated sessions.
   */
  async execute(
    executionContext: ExecutionContext,
    input: RefreshAuthTokenInput,
  ): Promise<Result<AuthResult, CoreError>> {
    return useCaseRunner.runSafely(async () =>
      this.appContext.transactionManager.runInTransaction(() =>
        this.refreshInTransaction(executionContext, input),
      ),
    );
  }

  private async refreshInTransaction(
    executionContext: ExecutionContext,
    input: RefreshAuthTokenInput,
  ): Promise<Result<AuthResult, CoreError>> {
    const now = this.appContext.clock.now().toISOString();
    const session = await this.loadRotatableSession(input.refreshToken, now);
    if (!session.ok) {
      return session;
    }

    const authResult = await this.issueReplacementSession(session.data, input, now);
    if (!authResult.ok) {
      return authResult;
    }

    const rotation = await this.persistRotation(
      session.data,
      authResult.data.refreshTokenSessionId,
      now,
    );
    if (!rotation.ok) {
      return rotation;
    }

    this.logRotation(executionContext, authResult.data);
    return authResult;
  }

  private async loadRotatableSession(
    refreshToken: string,
    now: string,
  ): Promise<Result<RefreshTokenSession, CoreError>> {
    const session = await this.sessionService.findRefreshSession(refreshToken);
    if (session === null) {
      return authFailures.invalidRefreshToken();
    }

    const activeSession = await this.ensureSessionIsActive(session, now);
    if (!activeSession.ok) {
      return activeSession;
    }

    return this.ensureSessionIsNotExpired(activeSession.data, now);
  }

  private async ensureSessionIsActive(
    session: RefreshTokenSession,
    now: string,
  ): Promise<Result<RefreshTokenSession, CoreError>> {
    if (session.status === "active") {
      return ok(session);
    }

    await this.appContext.auth.refreshTokens.revokeFamily({
      familyId: session.familyId,
      revokedAt: now,
      reason: "reuse_detected",
    });

    return session.status === "rotated"
      ? authFailures.refreshTokenReuseDetected()
      : authFailures.invalidRefreshToken();
  }

  private async ensureSessionIsNotExpired(
    session: RefreshTokenSession,
    now: string,
  ): Promise<Result<RefreshTokenSession, CoreError>> {
    const expired = refreshTokenSessionPolicy.isExpired(session, now);
    if (!expired.ok) {
      return expired;
    }
    if (!expired.data) {
      return ok(session);
    }

    const revoked = refreshTokenSessionTransitions.revoke(session, {
      revokedAt: now,
      reason: "expired",
    });
    if (!revoked.ok) {
      return revoked;
    }

    await this.appContext.auth.refreshTokens.save(revoked.data);
    return authFailures.expiredRefreshToken();
  }

  private async issueReplacementSession(
    session: RefreshTokenSession,
    input: RefreshAuthTokenInput,
    now: string,
  ): Promise<Result<AuthResult, CoreError>> {
    const user = await this.userLoader.load(session.userId);
    if (!user.ok) {
      return user;
    }

    return this.sessionService.issueAuthResult({
      user: user.data,
      issuedAt: now,
      familyId: session.familyId,
      ...(input.deviceId === undefined ? {} : { deviceId: input.deviceId }),
      ...(input.memberships === undefined ? {} : { memberships: input.memberships }),
    });
  }

  private async persistRotation(
    session: RefreshTokenSession,
    replacementSessionId: string,
    now: string,
  ): Promise<Result<RefreshTokenSession, CoreError>> {
    const rotated = refreshTokenSessionTransitions.rotate(session, {
      rotatedAt: now,
      rotatedToSessionId: replacementSessionId,
    });
    if (!rotated.ok) {
      return rotated;
    }

    await this.appContext.auth.refreshTokens.save(rotated.data);
    return rotated;
  }

  private logRotation(executionContext: ExecutionContext, result: AuthResult): void {
    this.appContext.logger.info("Refresh token rotated.", {
      requestId: executionContext.requestId,
      userId: result.user.id,
      refreshTokenSessionId: result.refreshTokenSessionId,
    });
  }
}
