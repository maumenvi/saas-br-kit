import type { OrganizationRoleConfig } from "../organization/index.ts";
import type { MembershipRole } from "./constants.ts";

/**
 * Evaluates permissions granted by membership roles.
 */
export class MembershipPermissionPolicy {
  /**
   * Checks whether a role grants one normalized permission.
   */
  allows(role: MembershipRole, permission: string, roleConfig: OrganizationRoleConfig): boolean {
    if (role === roleConfig.ownerRoleName) {
      return true;
    }
    if (
      permission.startsWith("actors:") ||
      [
        "organization:members:invite",
        "organization:members:write",
        "organization:members:remove",
        "organization:roles:write",
      ].includes(permission)
    ) {
      return false;
    }
    const permissions =
      roleConfig.employeeRoles.find((employeeRole) => employeeRole.name === role)?.permissions ??
      [];
    return permissions.some(
      (allowed) =>
        allowed === permission ||
        allowed === "*" ||
        (allowed.endsWith(":*") && permission.startsWith(allowed.slice(0, -1))),
    );
  }
}

/** Shared membership permission policy used by membership entities. */
export const membershipPermissionPolicy = new MembershipPermissionPolicy();
