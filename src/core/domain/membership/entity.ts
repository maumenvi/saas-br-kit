import type { Result } from "../../errors/result.ts";
import type { MembershipId, OrganizationId } from "../index.ts";
import type { OrganizationRoleConfig } from "../organization/index.ts";
import {
  ensureAllowedString,
  normalizeOptionalText,
  normalizeRequiredText,
  normalizeTimestamp,
} from "../validation/index.ts";
import type { MembershipRole, MembershipStatus } from "./constants.ts";
import { MEMBERSHIP_STATUSES } from "./constants.ts";
import { membershipPermissionPolicy } from "./permissions.ts";
import type {
  ActivateMembershipInput,
  ChangeMembershipRoleInput,
  CreateMembershipEntityInput,
  DisableMembershipInput,
  MembershipProps,
} from "./types.ts";

/**
 * Represents a user's role inside one organization.
 */
export class Membership {
  /** Membership identifier used by repositories. */
  public readonly id: MembershipId;

  /** Organization where the membership applies. */
  public readonly organizationId: OrganizationId;

  /** User that receives the role. */
  public readonly userId: string;

  /** Role granted to the user within the organization. */
  public readonly role: MembershipRole;

  /** Invitation or lifecycle status of the membership. */
  public readonly status: MembershipStatus;

  /** ISO timestamp for membership creation. */
  public readonly createdAt: string;

  /** ISO timestamp for the last membership update. */
  public readonly updatedAt: string;

  /** Optional user that invited this member. */
  public readonly invitedByUserId?: string;

  /** Stores normalized membership properties immutably. */
  private constructor(props: MembershipProps) {
    this.id = props.id;
    this.organizationId = props.organizationId;
    this.userId = props.userId;
    this.role = props.role;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    if (props.invitedByUserId !== undefined) {
      this.invitedByUserId = props.invitedByUserId;
    }
    Object.freeze(this);
  }

  /**
   * Creates a membership after validating role, status and timestamps.
   */
  static create(input: CreateMembershipEntityInput): Result<Membership> {
    const id = normalizeRequiredText("membership.id", input.id, { maxLength: 120 });
    if (!id.ok) {
      return id;
    }

    const organizationId = normalizeRequiredText(
      "membership.organizationId",
      input.organizationId,
      {
        maxLength: 120,
      },
    );
    if (!organizationId.ok) {
      return organizationId;
    }

    const userId = normalizeRequiredText("membership.userId", input.userId, { maxLength: 120 });
    if (!userId.ok) {
      return userId;
    }

    const role = normalizeRequiredText("membership.role", input.role, { maxLength: 80 });
    if (!role.ok) {
      return role;
    }

    const status = ensureAllowedString(
      "membership.status",
      input.status ?? "active",
      MEMBERSHIP_STATUSES,
    );
    if (!status.ok) {
      return status;
    }

    const createdAt = normalizeTimestamp("membership.createdAt", input.createdAt);
    if (!createdAt.ok) {
      return createdAt;
    }

    const updatedAt = normalizeTimestamp("membership.updatedAt", input.updatedAt ?? createdAt.data);
    if (!updatedAt.ok) {
      return updatedAt;
    }

    const invitedByUserId = normalizeOptionalText(
      "membership.invitedByUserId",
      input.invitedByUserId,
      { maxLength: 120 },
    );
    if (!invitedByUserId.ok) {
      return invitedByUserId;
    }

    return {
      ok: true,
      data: new Membership({
        id: id.data,
        organizationId: organizationId.data,
        userId: userId.data,
        role: role.data,
        status: status.data,
        createdAt: createdAt.data,
        updatedAt: updatedAt.data,
        ...(invitedByUserId.data === undefined ? {} : { invitedByUserId: invitedByUserId.data }),
      }),
    };
  }

  /**
   * Activates an invited membership at the acceptance time.
   */
  activate(input: ActivateMembershipInput): Result<Membership> {
    return Membership.create({
      ...this,
      status: "active",
      updatedAt: input.acceptedAt,
    });
  }

  /**
   * Changes the role while preserving the existing member identity.
   */
  changeRole(input: ChangeMembershipRoleInput): Result<Membership> {
    return Membership.create({
      ...this,
      role: input.role,
      updatedAt: input.updatedAt,
    });
  }

  /**
   * Disables the membership without deleting its audit-relevant history.
   */
  disable(input: DisableMembershipInput): Result<Membership> {
    return Membership.create({
      ...this,
      status: "disabled",
      updatedAt: input.disabledAt,
    });
  }

  /**
   * Checks whether the active membership grants one permission.
   */
  allowsPermission(permission: string, roleConfig: OrganizationRoleConfig): boolean {
    if (this.status !== "active") {
      return false;
    }
    return membershipPermissionPolicy.allows(this.role, permission, roleConfig);
  }
}
