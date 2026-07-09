import {
  type RefreshTokenSession,
  refreshTokenSessionFactory,
  type User,
} from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import type { AccessTokenMembershipClaim } from "../../../ports/index.ts";
import type { AuthAppContext, AuthResult } from "../types.ts";

/**
 * Issues access tokens and refresh-token sessions for authenticated users.
 */
export class AuthSessionService {
  private readonly appContext: AuthAppContext;

  /** Stores auth ports used to create, hash and persist token material. */
  constructor(appContext: AuthAppContext) {
    this.appContext = appContext;
  }

  /**
   * Creates one access token and one opaque refresh token session.
   */
  async issueAuthResult(
    input: Readonly<{
      user: User;
      issuedAt: string;
      familyId?: string;
      deviceId?: string;
      memberships?: readonly AccessTokenMembershipClaim[];
    }>,
  ): Promise<Result<AuthResult, CoreError>> {
    const secret = await this.appContext.auth.sessionManager.createRefreshTokenSecret({
      userId: input.user.id,
      issuedAt: input.issuedAt,
      ...(input.deviceId === undefined ? {} : { deviceId: input.deviceId }),
    });
    if (!secret.ok) {
      return secret;
    }

    const secretHash = await this.appContext.auth.refreshTokens.hashSecret(secret.data.secret);
    const session = refreshTokenSessionFactory.create({
      id: this.appContext.idGenerator.newId(),
      userId: input.user.id,
      familyId: input.familyId ?? this.appContext.idGenerator.newId(),
      secretHash,
      expiresAt: secret.data.expiresAt,
      createdAt: input.issuedAt,
      ...(input.deviceId === undefined ? {} : { deviceId: input.deviceId }),
    });
    if (!session.ok) {
      return session;
    }

    const accessToken = await this.appContext.auth.accessTokens.issueAccessToken({
      user: input.user,
      issuedAt: input.issuedAt,
      ...(input.memberships === undefined ? {} : { memberships: input.memberships }),
    });
    if (!accessToken.ok) {
      return accessToken;
    }

    await this.appContext.auth.refreshTokens.save(session.data);

    return ok({
      user: input.user,
      accessToken: accessToken.data.accessToken,
      ...(accessToken.data.expiresAt === undefined
        ? {}
        : { accessTokenExpiresAt: accessToken.data.expiresAt }),
      refreshToken: secret.data.secret,
      refreshTokenExpiresAt: secret.data.expiresAt,
      refreshTokenSessionId: session.data.id,
    });
  }

  /**
   * Finds a refresh-token session by hashing the opaque token secret.
   */
  async findRefreshSession(secret: string): Promise<RefreshTokenSession | null> {
    const secretHash = await this.appContext.auth.refreshTokens.hashSecret(secret);
    return this.appContext.auth.refreshTokens.findBySecretHash(secretHash);
  }
}
