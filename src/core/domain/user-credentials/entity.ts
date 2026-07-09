import type { Result } from "../../errors/result.ts";
import type { UserId } from "../index.ts";
import {
  ensureAllowedString,
  normalizeEmail,
  normalizeRequiredText,
  normalizeTimestamp,
} from "../validation/index.ts";
import type { UserCredentialStatus } from "./status.ts";
import { USER_CREDENTIAL_STATUSES } from "./status.ts";
import type { CreateUserCredentialsInput, UserCredentialsProps } from "./types.ts";

/**
 * Stores normalized password credential metadata without raw passwords.
 */
export class UserCredentials {
  /** User linked to these credentials. */
  public readonly userId: UserId;

  /** Normalized email used for credential lookup. */
  public readonly email: string;

  /** Stored password hash produced by an injected hasher. */
  public readonly passwordHash: string;

  /** Credential lifecycle status. */
  public readonly status: UserCredentialStatus;

  /** ISO timestamp for credential creation. */
  public readonly createdAt: string;

  /** ISO timestamp for the last credential update. */
  public readonly updatedAt: string;

  /** Stores normalized credential properties immutably. */
  private constructor(props: UserCredentialsProps) {
    this.userId = props.userId;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    Object.freeze(this);
  }

  /**
   * Creates password credentials after validating email, hash and timestamps.
   */
  static create(input: CreateUserCredentialsInput): Result<UserCredentials> {
    const userId = normalizeRequiredText("userCredentials.userId", input.userId, {
      maxLength: 120,
    });
    if (!userId.ok) {
      return userId;
    }

    const email = normalizeEmail("userCredentials.email", input.email);
    if (!email.ok) {
      return email;
    }

    const passwordHash = normalizeRequiredText("userCredentials.passwordHash", input.passwordHash, {
      maxLength: 300,
    });
    if (!passwordHash.ok) {
      return passwordHash;
    }

    const status = ensureAllowedString(
      "userCredentials.status",
      input.status ?? "active",
      USER_CREDENTIAL_STATUSES,
    );
    if (!status.ok) {
      return status;
    }

    const createdAt = normalizeTimestamp("userCredentials.createdAt", input.createdAt);
    if (!createdAt.ok) {
      return createdAt;
    }

    const updatedAt = normalizeTimestamp(
      "userCredentials.updatedAt",
      input.updatedAt ?? createdAt.data,
    );
    if (!updatedAt.ok) {
      return updatedAt;
    }

    return {
      ok: true,
      data: new UserCredentials({
        userId: userId.data,
        email: email.data,
        passwordHash: passwordHash.data,
        status: status.data,
        createdAt: createdAt.data,
        updatedAt: updatedAt.data,
      }),
    };
  }
}
