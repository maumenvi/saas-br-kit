import type { RefreshTokenSessionId, UserId } from "../index.ts";
import type { TimestampInput } from "../validation/index.ts";
import type { RefreshTokenSessionStatus } from "./status.ts";

export type RefreshTokenSessionProps = Readonly<{
  id: RefreshTokenSessionId;
  userId: UserId;
  familyId: string;
  secretHash: string;
  status: RefreshTokenSessionStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  rotatedToSessionId?: RefreshTokenSessionId;
  revokedAt?: string;
  revokedReason?: string;
  deviceId?: string;
}>;

export type CreateRefreshTokenSessionInput = Readonly<{
  id: RefreshTokenSessionId;
  userId: UserId;
  familyId: string;
  secretHash: string;
  status?: RefreshTokenSessionStatus;
  expiresAt: TimestampInput;
  createdAt: TimestampInput;
  updatedAt?: TimestampInput;
  rotatedToSessionId?: RefreshTokenSessionId;
  revokedAt?: TimestampInput;
  revokedReason?: string;
  deviceId?: string;
}>;

export type RotateRefreshTokenSessionInput = Readonly<{
  rotatedAt: TimestampInput;
  rotatedToSessionId: RefreshTokenSessionId;
}>;

export type RevokeRefreshTokenSessionInput = Readonly<{
  revokedAt: TimestampInput;
  reason?: string;
}>;

/**
 * Represents one opaque refresh token session stored by hash.
 */
export class RefreshTokenSession {
  /** Refresh session identifier used by repositories. */
  public readonly id: RefreshTokenSessionId;

  /** User that owns this refresh session. */
  public readonly userId: UserId;

  /** Token family used to revoke a rotation chain. */
  public readonly familyId: string;

  /** Hash of the opaque refresh secret. */
  public readonly secretHash: string;

  /** Lifecycle state for rotation and revocation. */
  public readonly status: RefreshTokenSessionStatus;

  /** ISO timestamp when the refresh session expires. */
  public readonly expiresAt: string;

  /** ISO timestamp for session creation. */
  public readonly createdAt: string;

  /** ISO timestamp for the last session update. */
  public readonly updatedAt: string;

  /** Optional session created after this one was rotated. */
  public readonly rotatedToSessionId?: RefreshTokenSessionId;

  /** Optional ISO timestamp when the session was revoked. */
  public readonly revokedAt?: string;

  /** Optional normalized revocation reason. */
  public readonly revokedReason?: string;

  /** Optional device correlation id. */
  public readonly deviceId?: string;

  /** Stores normalized refresh session properties immutably. */
  private constructor(props: RefreshTokenSessionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.familyId = props.familyId;
    this.secretHash = props.secretHash;
    this.status = props.status;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    if (props.rotatedToSessionId !== undefined) {
      this.rotatedToSessionId = props.rotatedToSessionId;
    }
    if (props.revokedAt !== undefined) {
      this.revokedAt = props.revokedAt;
    }
    if (props.revokedReason !== undefined) {
      this.revokedReason = props.revokedReason;
    }
    if (props.deviceId !== undefined) {
      this.deviceId = props.deviceId;
    }
    Object.freeze(this);
  }

  /**
   * Builds a refresh session from fields already validated by the factory.
   */
  static fromNormalized(props: RefreshTokenSessionProps): RefreshTokenSession {
    return new RefreshTokenSession(props);
  }
}
