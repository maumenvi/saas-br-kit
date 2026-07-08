import type { Result } from "../../errors/result.ts";
import type { UserId } from "../index.ts";
import {
  ensureAllowedString,
  normalizeEmail,
  normalizeOptionalText,
  normalizeRequiredText,
  normalizeTimestamp,
} from "../validation/index.ts";
import type { UserStatus } from "./status.ts";
import { USER_STATUSES } from "./status.ts";
import type { CreateUserEntityInput, UserProps } from "./types.ts";

/**
 * Represents an authenticated user known by the SDK Core.
 */
export class User {
  /** User identifier used by auth, memberships and audit logs. */
  public readonly id: UserId;

  /** Normalized email address for identity lookup. */
  public readonly email: string;

  /** Account lifecycle status. */
  public readonly status: UserStatus;

  /** ISO timestamp for entity creation. */
  public readonly createdAt: string;

  /** ISO timestamp for the last entity update. */
  public readonly updatedAt: string;

  /** Optional display name shown in product surfaces. */
  public readonly displayName?: string;

  /** Stores normalized user properties immutably. */
  private constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    if (props.displayName !== undefined) {
      this.displayName = props.displayName;
    }
    Object.freeze(this);
  }

  /**
   * Creates a user after validating identity, email, status and timestamps.
   */
  static create(input: CreateUserEntityInput): Result<User> {
    const id = normalizeRequiredText("user.id", input.id, { maxLength: 120 });
    if (!id.ok) {
      return id;
    }

    const email = normalizeEmail("user.email", input.email);
    if (!email.ok) {
      return email;
    }

    const status = ensureAllowedString("user.status", input.status ?? "active", USER_STATUSES);
    if (!status.ok) {
      return status;
    }

    const createdAt = normalizeTimestamp("user.createdAt", input.createdAt);
    if (!createdAt.ok) {
      return createdAt;
    }

    const updatedAt = normalizeTimestamp("user.updatedAt", input.updatedAt ?? createdAt.data);
    if (!updatedAt.ok) {
      return updatedAt;
    }

    const displayName = normalizeOptionalText("user.displayName", input.displayName, {
      minLength: 2,
      maxLength: 120,
    });
    if (!displayName.ok) {
      return displayName;
    }

    return {
      ok: true,
      data: new User({
        id: id.data,
        email: email.data,
        status: status.data,
        createdAt: createdAt.data,
        updatedAt: updatedAt.data,
        ...(displayName.data === undefined ? {} : { displayName: displayName.data }),
      }),
    };
  }
}
