import type { CoreError, Result } from "../../../errors/result.ts";
import { ok } from "../../../errors/result.ts";
import type { AuthAppContext, AuthenticatedOrganizationAccess } from "../types.ts";

/** Resolves active tenant memberships used in internal access-token claims. */
export class AuthenticatedOrganizationAccessService {
  private readonly appContext: AuthAppContext;

  constructor(appContext: AuthAppContext) {
    this.appContext = appContext;
  }

  /** Lists organizations available to a user and optionally filters by canonical URL. */
  async resolve(
    userId: string,
    organizationUrl: string | null | undefined,
  ): Promise<Result<readonly AuthenticatedOrganizationAccess[] | undefined, CoreError>> {
    const tenantAccess = this.appContext.tenantAccess;
    if (tenantAccess === undefined) {
      return organizationUrl === undefined || organizationUrl === null
        ? ok(undefined)
        : {
            ok: false,
            error: {
              kind: "infrastructure",
              code: "auth.tenant_access_unconfigured",
              message: "Tenant access repositories are required for organization URL login.",
            },
          };
    }

    const memberships = await tenantAccess.memberships.listByUserId(userId);
    const organizations = new Map<string, AuthenticatedOrganizationAccess>();
    for (const membership of memberships) {
      if (membership.status !== "active") continue;
      const organization = await tenantAccess.organizations.findById(membership.organizationId);
      if (organization === null || organization.status !== "active") continue;
      const employeeRole = organization.roleConfig.employeeRoles.find(
        (role) => role.name === membership.role,
      );
      organizations.set(
        organization.id,
        Object.freeze({
          organizationId: organization.id,
          name: organization.name,
          role: membership.role,
          permissions:
            membership.role === organization.roleConfig.ownerRoleName
              ? Object.freeze(["*"])
              : (employeeRole?.permissions ?? Object.freeze([])),
          ...(organization.subdomain === undefined ? {} : { subdomain: organization.subdomain }),
          ...(organization.url === undefined ? {} : { url: organization.url }),
        }),
      );
    }

    if (tenantAccess.organizations.listByOwnerUserId !== undefined) {
      for (const organization of await tenantAccess.organizations.listByOwnerUserId(userId)) {
        if (organization.status !== "active") continue;
        organizations.set(
          organization.id,
          Object.freeze({
            organizationId: organization.id,
            name: organization.name,
            role: organization.roleConfig.ownerRoleName,
            permissions: Object.freeze(["*"]),
            ...(organization.subdomain === undefined ? {} : { subdomain: organization.subdomain }),
            ...(organization.url === undefined ? {} : { url: organization.url }),
          }),
        );
      }
    }

    let access = [...organizations.values()];
    if (organizationUrl !== undefined && organizationUrl !== null) {
      let normalizedUrl: string;
      try {
        normalizedUrl = new URL(organizationUrl).toString();
      } catch {
        return {
          ok: false,
          error: {
            kind: "validation",
            code: "auth.organization_url_invalid",
            message: "organizationUrl must be an absolute URL.",
          },
        };
      }
      access = access.filter(
        (item) => item.url !== undefined && new URL(item.url).toString() === normalizedUrl,
      );
      if (access.length === 0) {
        return {
          ok: false,
          error: {
            kind: "authorization",
            code: "auth.organization_url_access_denied",
            message: "Actor has no organization access for the requested URL.",
          },
        };
      }
    }
    return ok(Object.freeze(access));
  }
}
