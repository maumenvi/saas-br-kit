import type { VerifiedAccessToken } from "#core";
import type { SaasBrNestAppContext } from "../module/options.ts";

const emptyPermissions: readonly string[] = Object.freeze([]);

export type AuthenticatedRequestUser = Readonly<{
  userId: string;
  organizationId?: string;
  permissions: readonly string[];
}>;

/**
 * Resolves request authorization from verified token identity and current persisted tenant access.
 */
export class RequestAuthorizationResolver {
  private readonly appContext: SaasBrNestAppContext;

  /** Stores the repository ports used to revalidate tenant authorization. */
  constructor(appContext: SaasBrNestAppContext) {
    this.appContext = appContext;
  }

  /**
   * Builds trusted request identity without accepting roles or permissions from the token.
   */
  async resolve(claims: VerifiedAccessToken): Promise<AuthenticatedRequestUser> {
    const organizationId = this.organizationIdFromClaims(claims);
    if (organizationId === undefined) {
      return this.resolveFromPersistedAccess(claims.userId);
    }

    const organization = await this.appContext.repositories.organizations.findById(organizationId);
    if (organization === null || organization.status !== "active") {
      return this.withoutTenant(claims.userId);
    }

    if (organization.ownerUserId === claims.userId) {
      return this.authorized(claims.userId, organizationId, Object.freeze(["*"]));
    }

    const membership = await this.appContext.repositories.memberships.findByOrganizationIdAndUserId(
      {
        organizationId,
        userId: claims.userId,
      },
    );
    if (membership === null || membership.status !== "active") {
      return this.withoutTenant(claims.userId);
    }

    const permissions =
      membership.role === organization.roleConfig.ownerRoleName
        ? Object.freeze(["*"])
        : Object.freeze([
            ...(organization.roleConfig.employeeRoles.find((role) => role.name === membership.role)
              ?.permissions ?? emptyPermissions),
          ]);

    return this.authorized(claims.userId, organizationId, permissions);
  }

  private async resolveFromPersistedAccess(userId: string): Promise<AuthenticatedRequestUser> {
    const ownerOrganizations =
      await this.appContext.repositories.organizations.listByOwnerUserId?.(userId);
    const activeOwnerOrganization = ownerOrganizations?.find(
      (organization) => organization.status === "active",
    );
    if (activeOwnerOrganization !== undefined) {
      return this.authorized(userId, activeOwnerOrganization.id, Object.freeze(["*"]));
    }

    const memberships = await this.appContext.repositories.memberships.listByUserId(userId);
    for (const membership of memberships) {
      if (membership.status !== "active") {
        continue;
      }

      const organization = await this.appContext.repositories.organizations.findById(
        membership.organizationId,
      );
      if (organization === null || organization.status !== "active") {
        continue;
      }

      const permissions =
        membership.role === organization.roleConfig.ownerRoleName
          ? Object.freeze(["*"])
          : Object.freeze([
              ...(organization.roleConfig.employeeRoles.find(
                (role) => role.name === membership.role,
              )?.permissions ?? emptyPermissions),
            ]);
      return this.authorized(userId, organization.id, permissions);
    }

    return this.withoutTenant(userId);
  }

  /** Selects the first active organization emitted by the existing internal token flow. */
  private organizationIdFromClaims(claims: VerifiedAccessToken): string | undefined {
    const organizationId = claims.memberships?.find(
      (membership) => membership.status === "active",
    )?.organizationId;
    return typeof organizationId === "string" && organizationId.trim().length > 0
      ? organizationId
      : undefined;
  }

  private authorized(
    userId: string,
    organizationId: string,
    permissions: readonly string[],
  ): AuthenticatedRequestUser {
    return Object.freeze({
      userId,
      organizationId,
      permissions,
    });
  }

  /** Preserves authenticated identity while removing stale tenant authorization. */
  private withoutTenant(userId: string): AuthenticatedRequestUser {
    return Object.freeze({
      userId,
      permissions: emptyPermissions,
    });
  }
}
