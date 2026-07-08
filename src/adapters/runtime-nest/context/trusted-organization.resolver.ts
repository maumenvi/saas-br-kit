import { ForbiddenException } from "@nestjs/common";
import type { SaasBrNestAppContext } from "../module/options.ts";
import type { NestRequestLike } from "./execution-context.factory.ts";

const emptyPermissions: readonly string[] = Object.freeze([]);

type OrganizationAccess = Readonly<{
  organizationId: string;
  permissions: readonly string[];
}>;

/** Resolves a trusted tenant scope from JWT-backed identity and persisted access. */
export class TrustedOrganizationResolver {
  private readonly appContext: SaasBrNestAppContext;

  constructor(appContext: SaasBrNestAppContext) {
    this.appContext = appContext;
  }

  /** Returns one authorized organization id for the current authenticated actor. */
  async resolve(request: NestRequestLike): Promise<OrganizationAccess> {
    const authenticatedUser = request.user;
    if (authenticatedUser === undefined) {
      throw this.authorizationError(
        "auth.user_identity_required",
        "Authenticated user identity is required.",
      );
    }

    const organizationIdFromToken = this.normalizeOrganizationId(authenticatedUser.organizationId);
    if (organizationIdFromToken !== undefined) {
      return Object.freeze({
        organizationId: organizationIdFromToken,
        permissions: authenticatedUser.permissions,
      });
    }

    const fallbackAccess = await this.resolvePersistedAccess(authenticatedUser.userId);
    if (fallbackAccess !== undefined) {
      return fallbackAccess;
    }

    throw this.authorizationError(
      "auth.organization_context_required",
      "Authenticated actor has no active organization access.",
    );
  }

  private async resolvePersistedAccess(userId: string): Promise<OrganizationAccess | undefined> {
    const ownerOrganizations =
      await this.appContext.repositories.organizations.listByOwnerUserId?.(userId);
    const activeOwnerOrganization = ownerOrganizations?.find(
      (organization) => organization.status === "active",
    );
    if (activeOwnerOrganization !== undefined) {
      return Object.freeze({
        organizationId: activeOwnerOrganization.id,
        permissions: Object.freeze(["*"]),
      });
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

      return Object.freeze({
        organizationId: organization.id,
        permissions,
      });
    }

    return undefined;
  }

  private normalizeOrganizationId(organizationId: string | undefined): string | undefined {
    if (typeof organizationId !== "string") {
      return undefined;
    }
    const value = organizationId.trim();
    return value.length > 0 ? value : undefined;
  }

  private authorizationError(code: string, message: string): ForbiddenException {
    return new ForbiddenException({
      error: {
        kind: "authorization",
        code,
        message,
      },
    });
  }
}
