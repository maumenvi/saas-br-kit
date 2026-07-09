import type { Result } from "../../errors/result.ts";
import { refreshTokenSessionFactory } from "./factory.ts";
import type {
  RefreshTokenSession,
  RevokeRefreshTokenSessionInput,
  RotateRefreshTokenSessionInput,
} from "./types.ts";

/**
 * Applies immutable rotation and revocation transitions to refresh sessions.
 */
export class RefreshTokenSessionTransitions {
  /**
   * Compatibility facade for legacy static refresh-session rotation calls.
   */
  static rotate(
    session: RefreshTokenSession,
    input: RotateRefreshTokenSessionInput,
  ): Result<RefreshTokenSession> {
    return refreshTokenSessionTransitions.rotate(session, input);
  }

  /**
   * Compatibility facade for legacy static refresh-session revocation calls.
   */
  static revoke(
    session: RefreshTokenSession,
    input: RevokeRefreshTokenSessionInput,
  ): Result<RefreshTokenSession> {
    return refreshTokenSessionTransitions.revoke(session, input);
  }

  /**
   * Marks a refresh session as rotated into a replacement session.
   */
  rotate(
    session: RefreshTokenSession,
    input: RotateRefreshTokenSessionInput,
  ): Result<RefreshTokenSession> {
    return refreshTokenSessionFactory.create({
      ...session,
      status: "rotated",
      updatedAt: input.rotatedAt,
      rotatedToSessionId: input.rotatedToSessionId,
    });
  }

  /**
   * Revokes a refresh session with an optional normalized reason.
   */
  revoke(
    session: RefreshTokenSession,
    input: RevokeRefreshTokenSessionInput,
  ): Result<RefreshTokenSession> {
    return refreshTokenSessionFactory.create({
      ...session,
      status: "revoked",
      updatedAt: input.revokedAt,
      revokedAt: input.revokedAt,
      ...(input.reason === undefined ? {} : { revokedReason: input.reason }),
    });
  }
}

/** Shared refresh-token transitions service used by auth application classes. */
export const refreshTokenSessionTransitions = new RefreshTokenSessionTransitions();
