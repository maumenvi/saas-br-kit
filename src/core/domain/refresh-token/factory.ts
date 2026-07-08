import type { Result } from "../../errors/result.ts";
import {
  ensureAllowedString,
  normalizeOptionalText,
  normalizeRequiredText,
  normalizeTimestamp,
} from "../validation/index.ts";
import { REFRESH_TOKEN_SESSION_STATUSES } from "./status.ts";
import { type CreateRefreshTokenSessionInput, RefreshTokenSession } from "./types.ts";

/**
 * Creates refresh token sessions without exposing raw refresh secrets.
 */
export class RefreshTokenSessionFactory {
  /**
   * Compatibility facade for legacy static refresh-session creation calls.
   */
  static create(input: CreateRefreshTokenSessionInput): Result<RefreshTokenSession> {
    return refreshTokenSessionFactory.create(input);
  }

  /**
   * Validates and creates an immutable refresh token session.
   */
  create(input: CreateRefreshTokenSessionInput): Result<RefreshTokenSession> {
    const id = normalizeRequiredText("refreshTokenSession.id", input.id, { maxLength: 120 });
    if (!id.ok) {
      return id;
    }

    const userId = normalizeRequiredText("refreshTokenSession.userId", input.userId, {
      maxLength: 120,
    });
    if (!userId.ok) {
      return userId;
    }

    const familyId = normalizeRequiredText("refreshTokenSession.familyId", input.familyId, {
      maxLength: 120,
    });
    if (!familyId.ok) {
      return familyId;
    }

    const secretHash = normalizeRequiredText("refreshTokenSession.secretHash", input.secretHash, {
      maxLength: 300,
    });
    if (!secretHash.ok) {
      return secretHash;
    }

    const status = ensureAllowedString(
      "refreshTokenSession.status",
      input.status ?? "active",
      REFRESH_TOKEN_SESSION_STATUSES,
    );
    if (!status.ok) {
      return status;
    }

    const expiresAt = normalizeTimestamp("refreshTokenSession.expiresAt", input.expiresAt);
    if (!expiresAt.ok) {
      return expiresAt;
    }

    const createdAt = normalizeTimestamp("refreshTokenSession.createdAt", input.createdAt);
    if (!createdAt.ok) {
      return createdAt;
    }

    const updatedAt = normalizeTimestamp(
      "refreshTokenSession.updatedAt",
      input.updatedAt ?? createdAt.data,
    );
    if (!updatedAt.ok) {
      return updatedAt;
    }

    const rotatedToSessionId = normalizeOptionalText(
      "refreshTokenSession.rotatedToSessionId",
      input.rotatedToSessionId,
      { maxLength: 120 },
    );
    if (!rotatedToSessionId.ok) {
      return rotatedToSessionId;
    }

    const revokedAt =
      input.revokedAt === undefined
        ? { ok: true as const, data: undefined }
        : normalizeTimestamp("refreshTokenSession.revokedAt", input.revokedAt);
    if (!revokedAt.ok) {
      return revokedAt;
    }

    const revokedReason = normalizeOptionalText(
      "refreshTokenSession.revokedReason",
      input.revokedReason,
      { maxLength: 120 },
    );
    if (!revokedReason.ok) {
      return revokedReason;
    }

    const deviceId = normalizeOptionalText("refreshTokenSession.deviceId", input.deviceId, {
      maxLength: 120,
    });
    if (!deviceId.ok) {
      return deviceId;
    }

    return {
      ok: true,
      data: RefreshTokenSession.fromNormalized({
        id: id.data,
        userId: userId.data,
        familyId: familyId.data,
        secretHash: secretHash.data,
        status: status.data,
        expiresAt: expiresAt.data,
        createdAt: createdAt.data,
        updatedAt: updatedAt.data,
        ...(rotatedToSessionId.data === undefined
          ? {}
          : { rotatedToSessionId: rotatedToSessionId.data }),
        ...(revokedAt.data === undefined ? {} : { revokedAt: revokedAt.data }),
        ...(revokedReason.data === undefined ? {} : { revokedReason: revokedReason.data }),
        ...(deviceId.data === undefined ? {} : { deviceId: deviceId.data }),
      }),
    };
  }
}

/** Shared refresh-token session factory used by auth domain flows. */
export const refreshTokenSessionFactory = new RefreshTokenSessionFactory();
