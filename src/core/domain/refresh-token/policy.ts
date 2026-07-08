import type { Result } from "../../errors/result.ts";
import { normalizeTimestamp, type TimestampInput } from "../validation/index.ts";
import type { RefreshTokenSession } from "./types.ts";

/**
 * Evaluates refresh token session policies without external dependencies.
 */
export class RefreshTokenSessionPolicy {
  /**
   * Compatibility facade for legacy static expiration checks.
   */
  static isExpired(session: RefreshTokenSession, at: TimestampInput): Result<boolean> {
    return refreshTokenSessionPolicy.isExpired(session, at);
  }

  /**
   * Checks whether a refresh session is expired at a given timestamp.
   */
  isExpired(session: RefreshTokenSession, at: TimestampInput): Result<boolean> {
    const timestamp = normalizeTimestamp("refreshTokenSession.checkedAt", at);
    if (!timestamp.ok) {
      return timestamp;
    }

    return { ok: true, data: Date.parse(session.expiresAt) <= Date.parse(timestamp.data) };
  }
}

/** Shared refresh-token policy used by auth application classes. */
export const refreshTokenSessionPolicy = new RefreshTokenSessionPolicy();
