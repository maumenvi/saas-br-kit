import type { Result } from "../../errors/result.ts";
import type { OrganizationId } from "../index.ts";
import type { SafeMetadata } from "../metadata/index.ts";
import { freezeSafeMetadata } from "../metadata/index.ts";
import {
  ensureAllowedString,
  normalizeOptionalText,
  normalizeRequiredText,
  normalizeTimestamp,
} from "../validation/index.ts";
import type { OrganizationStatus } from "./status.ts";
import { ORGANIZATION_STATUSES } from "./status.ts";
import type {
  CreateOrganizationEntityInput,
  OrganizationEmployeeRole,
  OrganizationProps,
  OrganizationRoleConfig,
} from "./types.ts";

const subdomainPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export const DEFAULT_EMPLOYEE_PERMISSIONS = Object.freeze(["*"]);

export const DEFAULT_ORGANIZATION_ROLE_CONFIG: OrganizationRoleConfig = Object.freeze({
  ownerRoleName: "owner",
  employeeRoles: Object.freeze([
    Object.freeze({
      name: "employee",
      permissions: DEFAULT_EMPLOYEE_PERMISSIONS,
    }),
  ]),
});

/**
 * Represents a tenant organization owned by an initial user.
 */
export class Organization {
  /** Organization identifier used by repositories and tenant-scoped flows. */
  public readonly id: OrganizationId;

  /** User that initially owns this tenant. */
  public readonly ownerUserId: string;

  /** Display name shown for the tenant. */
  public readonly name: string;

  /** Lifecycle status used to enable or disable the tenant. */
  public readonly status: OrganizationStatus;

  /** ISO timestamp for entity creation. */
  public readonly createdAt: string;

  /** ISO timestamp for the last entity update. */
  public readonly updatedAt: string;

  /** Optional DNS label used to identify the organization. */
  public readonly subdomain?: string;

  /** Optional canonical organization URL. */
  public readonly url?: string;

  /** Owner label and employee role permissions configured for this organization. */
  public readonly roleConfig: OrganizationRoleConfig;

  /** Optional safe metadata for tenant-specific extension data. */
  public readonly metadata?: SafeMetadata;

  /** Stores normalized organization properties immutably. */
  private constructor(props: OrganizationProps) {
    this.id = props.id;
    this.ownerUserId = props.ownerUserId;
    this.name = props.name;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    if (props.subdomain !== undefined) {
      this.subdomain = props.subdomain;
    }
    if (props.url !== undefined) {
      this.url = props.url;
    }
    this.roleConfig = props.roleConfig;
    if (props.metadata !== undefined) {
      this.metadata = props.metadata;
    }
    Object.freeze(this);
  }

  /**
   * Creates an organization after validating identifiers, name, status and timestamps.
   */
  static create(input: CreateOrganizationEntityInput): Result<Organization> {
    const id = normalizeRequiredText("organization.id", input.id, { maxLength: 120 });
    if (!id.ok) {
      return id;
    }

    const ownerUserId = normalizeRequiredText("organization.ownerUserId", input.ownerUserId, {
      maxLength: 120,
    });
    if (!ownerUserId.ok) {
      return ownerUserId;
    }

    const name = normalizeRequiredText("organization.name", input.name, {
      minLength: 2,
      maxLength: 120,
    });
    if (!name.ok) {
      return name;
    }

    const status = ensureAllowedString(
      "organization.status",
      input.status ?? "active",
      ORGANIZATION_STATUSES,
    );
    if (!status.ok) {
      return status;
    }

    const createdAt = normalizeTimestamp("organization.createdAt", input.createdAt);
    if (!createdAt.ok) {
      return createdAt;
    }

    const updatedAt = normalizeTimestamp(
      "organization.updatedAt",
      input.updatedAt ?? createdAt.data,
    );
    if (!updatedAt.ok) {
      return updatedAt;
    }

    const subdomain = normalizeOptionalText("organization.subdomain", input.subdomain, {
      maxLength: 63,
    });
    if (!subdomain.ok) {
      return subdomain;
    }
    const normalizedSubdomain = subdomain.data?.toLowerCase();
    if (normalizedSubdomain !== undefined && !subdomainPattern.test(normalizedSubdomain)) {
      return {
        ok: false,
        error: {
          kind: "validation",
          code: "organization.subdomain.invalid",
          message: "organization.subdomain must be a valid DNS label.",
        },
      };
    }

    const url = normalizeOptionalText("organization.url", input.url, { maxLength: 2048 });
    if (!url.ok) {
      return url;
    }
    if (url.data !== undefined) {
      try {
        const parsed = new URL(url.data);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error("Unsupported protocol.");
        }
      } catch {
        return {
          ok: false,
          error: {
            kind: "validation",
            code: "organization.url.invalid",
            message: "organization.url must be an absolute HTTP or HTTPS URL.",
          },
        };
      }
    }

    const roleConfig = Organization.normalizeRoleConfig(input.roleConfig);
    if (!roleConfig.ok) {
      return roleConfig;
    }

    const metadata = freezeSafeMetadata(input.metadata);

    return {
      ok: true,
      data: new Organization({
        id: id.data,
        ownerUserId: ownerUserId.data,
        name: name.data,
        status: status.data,
        createdAt: createdAt.data,
        updatedAt: updatedAt.data,
        ...(normalizedSubdomain === undefined ? {} : { subdomain: normalizedSubdomain }),
        ...(url.data === undefined ? {} : { url: url.data }),
        roleConfig: roleConfig.data,
        ...(metadata === undefined ? {} : { metadata }),
      }),
    };
  }

  private static normalizeRoleConfig(
    input: CreateOrganizationEntityInput["roleConfig"],
  ): Result<OrganizationRoleConfig> {
    const ownerRoleName = normalizeRequiredText(
      "organization.roleConfig.ownerRoleName",
      input?.ownerRoleName ?? DEFAULT_ORGANIZATION_ROLE_CONFIG.ownerRoleName,
      { maxLength: 80 },
    );
    if (!ownerRoleName.ok) {
      return ownerRoleName;
    }
    const employeeRoles = input?.employeeRoles ?? DEFAULT_ORGANIZATION_ROLE_CONFIG.employeeRoles;
    if (employeeRoles.length === 0) {
      return {
        ok: false,
        error: {
          kind: "validation",
          code: "organization.roleConfig.employeeRoles.empty",
          message: "organization.roleConfig must define at least one employee role.",
        },
      };
    }
    const normalizedRoles: OrganizationEmployeeRole[] = [];
    const names = new Set([ownerRoleName.data.toLowerCase()]);
    for (const role of employeeRoles) {
      const name = normalizeRequiredText("organization.roleConfig.employeeRole.name", role.name, {
        maxLength: 80,
      });
      if (!name.ok) {
        return name;
      }
      const normalizedName = name.data.toLowerCase();
      if (names.has(normalizedName)) {
        return {
          ok: false,
          error: {
            kind: "validation",
            code: "organization.roleConfig.role_duplicate",
            message: "Organization role names must be unique.",
          },
        };
      }
      names.add(normalizedName);
      const permissions = Object.freeze([
        ...new Set(role.permissions.map((permission) => permission.trim()).filter(Boolean)),
      ]);
      if (permissions.some((permission) => permission.startsWith("actors:"))) {
        return {
          ok: false,
          error: {
            kind: "validation",
            code: "organization.roleConfig.employee_actor_permission",
            message: "Employee roles cannot receive actor administration permissions.",
          },
        };
      }
      normalizedRoles.push(Object.freeze({ name: name.data, permissions }));
    }
    return {
      ok: true,
      data: Object.freeze({
        ownerRoleName: ownerRoleName.data,
        employeeRoles: Object.freeze(normalizedRoles),
      }),
    };
  }
}
