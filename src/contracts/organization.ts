import { ORGANIZATION_STATUSES, type OrganizationStatus } from "../core/index.ts";
import { type SafeMetadataDto, safeMetadataSchema } from "./metadata.ts";
import {
  ContractSchema,
  invalid,
  isPlainRecord,
  mergeValidationIssues,
  valid,
  validateEnum,
  validateIsoDateTime,
  validateNonEmptyString,
} from "./schema-validation.ts";

export type OrganizationStatusDto = OrganizationStatus;

export type OrganizationEmployeeRoleDto = Readonly<{
  name: string;
  permissions: readonly string[];
}>;

export type OrganizationRoleConfigDto = Readonly<{
  ownerRoleName?: string;
  employeeRoles?: readonly OrganizationEmployeeRoleDto[];
}>;

export type OrganizationDto = Readonly<{
  id: string;
  ownerUserId: string;
  name: string;
  status: OrganizationStatusDto;
  subdomain?: string;
  url?: string;
  roleConfig?: OrganizationRoleConfigDto;
  createdAt: string;
  updatedAt: string;
  metadata?: SafeMetadataDto;
}>;

export type CreateOrganizationInputDto = Readonly<{
  ownerUserId: string;
  name: string;
  subdomain?: string;
  url?: string;
  roleConfig?: OrganizationRoleConfigDto;
  metadata?: SafeMetadataDto;
}>;

export type OrganizationPersistenceDto = OrganizationDto;

export const organizationStatusSchema = new ContractSchema<OrganizationStatusDto>(
  "organizationStatus",
  (value, path) => validateEnum(value, path, ORGANIZATION_STATUSES),
);

function validateRoleConfig(
  value: unknown,
  path: readonly string[],
): import("./schema-validation.ts").SchemaValidationResult<OrganizationRoleConfigDto> {
  if (!isPlainRecord(value)) {
    return invalid(path, "Expected organization role configuration object.");
  }
  const ownerRoleName =
    value.ownerRoleName === undefined
      ? valid<string | undefined>(undefined)
      : validateNonEmptyString(value.ownerRoleName, [...path, "ownerRoleName"]);
  const issues = [...(ownerRoleName.ok ? [] : ownerRoleName.issues)];
  const employeeRoles: OrganizationEmployeeRoleDto[] = [];
  if (value.employeeRoles !== undefined) {
    if (!Array.isArray(value.employeeRoles)) {
      issues.push({
        path: [...path, "employeeRoles"],
        message: "Expected employee roles array.",
      });
    } else {
      for (const [index, item] of value.employeeRoles.entries()) {
        const itemPath = [...path, "employeeRoles", String(index)];
        if (!isPlainRecord(item)) {
          issues.push({ path: itemPath, message: "Expected employee role object." });
          continue;
        }
        const name = validateNonEmptyString(item.name, [...itemPath, "name"]);
        if (!name.ok) {
          issues.push(...name.issues);
        }
        if (!Array.isArray(item.permissions)) {
          issues.push({
            path: [...itemPath, "permissions"],
            message: "Expected permissions array.",
          });
          continue;
        }
        const permissions: string[] = [];
        for (const [permissionIndex, permission] of item.permissions.entries()) {
          const result = validateNonEmptyString(permission, [
            ...itemPath,
            "permissions",
            String(permissionIndex),
          ]);
          if (result.ok) {
            permissions.push(result.value);
          } else {
            issues.push(...result.issues);
          }
        }
        if (name.ok) {
          employeeRoles.push(
            Object.freeze({ name: name.value, permissions: Object.freeze(permissions) }),
          );
        }
      }
    }
  }
  if (issues.length > 0 || !ownerRoleName.ok) {
    return { ok: false, issues };
  }
  return valid(
    Object.freeze({
      ...(ownerRoleName.value === undefined ? {} : { ownerRoleName: ownerRoleName.value }),
      ...(value.employeeRoles === undefined ? {} : { employeeRoles: Object.freeze(employeeRoles) }),
    }),
  );
}

export const organizationDtoSchema = new ContractSchema<OrganizationDto>(
  "organizationDto",
  (value, path) => {
    if (!isPlainRecord(value)) {
      return invalid(path, "Expected organization object.");
    }

    const id = validateNonEmptyString(value.id, [...path, "id"]);
    const ownerUserId = validateNonEmptyString(value.ownerUserId, [...path, "ownerUserId"]);
    const name = validateNonEmptyString(value.name, [...path, "name"]);
    const status = organizationStatusSchema.validate(value.status, [...path, "status"]);
    const subdomain =
      value.subdomain === undefined
        ? valid<string | undefined>(undefined)
        : validateNonEmptyString(value.subdomain, [...path, "subdomain"]);
    const url =
      value.url === undefined
        ? valid<string | undefined>(undefined)
        : validateNonEmptyString(value.url, [...path, "url"]);
    const roleConfig =
      value.roleConfig === undefined
        ? valid<OrganizationRoleConfigDto | undefined>(undefined)
        : validateRoleConfig(value.roleConfig, [...path, "roleConfig"]);
    const createdAt = validateIsoDateTime(value.createdAt, [...path, "createdAt"]);
    const updatedAt = validateIsoDateTime(value.updatedAt, [...path, "updatedAt"]);
    const metadata =
      value.metadata === undefined
        ? valid<SafeMetadataDto | undefined>(undefined)
        : safeMetadataSchema.validate(value.metadata, [...path, "metadata"]);
    const issues = mergeValidationIssues([
      id,
      ownerUserId,
      name,
      status,
      subdomain,
      url,
      roleConfig,
      createdAt,
      updatedAt,
      metadata,
    ]);

    if (
      issues.length > 0 ||
      !id.ok ||
      !ownerUserId.ok ||
      !name.ok ||
      !status.ok ||
      !subdomain.ok ||
      !url.ok ||
      !roleConfig.ok ||
      !createdAt.ok ||
      !updatedAt.ok ||
      !metadata.ok
    ) {
      return { ok: false, issues };
    }

    return valid(
      Object.freeze({
        id: id.value,
        ownerUserId: ownerUserId.value,
        name: name.value,
        status: status.value,
        ...(subdomain.value === undefined ? {} : { subdomain: subdomain.value }),
        ...(url.value === undefined ? {} : { url: url.value }),
        ...(roleConfig.value === undefined ? {} : { roleConfig: roleConfig.value }),
        createdAt: createdAt.value,
        updatedAt: updatedAt.value,
        ...(metadata.value === undefined ? {} : { metadata: metadata.value }),
      }),
    );
  },
);

export const createOrganizationInputSchema = new ContractSchema<CreateOrganizationInputDto>(
  "createOrganizationInput",
  (value, path) => {
    if (!isPlainRecord(value)) {
      return invalid(path, "Expected create organization input object.");
    }

    const ownerUserId = validateNonEmptyString(value.ownerUserId, [...path, "ownerUserId"]);
    const name = validateNonEmptyString(value.name, [...path, "name"]);
    const subdomain =
      value.subdomain === undefined
        ? valid<string | undefined>(undefined)
        : validateNonEmptyString(value.subdomain, [...path, "subdomain"]);
    const url =
      value.url === undefined
        ? valid<string | undefined>(undefined)
        : validateNonEmptyString(value.url, [...path, "url"]);
    const roleConfig =
      value.roleConfig === undefined
        ? valid<OrganizationRoleConfigDto | undefined>(undefined)
        : validateRoleConfig(value.roleConfig, [...path, "roleConfig"]);
    const metadata =
      value.metadata === undefined
        ? valid<SafeMetadataDto | undefined>(undefined)
        : safeMetadataSchema.validate(value.metadata, [...path, "metadata"]);
    const issues = mergeValidationIssues([ownerUserId, name, subdomain, url, roleConfig, metadata]);

    if (
      issues.length > 0 ||
      !ownerUserId.ok ||
      !name.ok ||
      !subdomain.ok ||
      !url.ok ||
      !roleConfig.ok ||
      !metadata.ok
    ) {
      return { ok: false, issues };
    }

    return valid(
      Object.freeze({
        ownerUserId: ownerUserId.value,
        name: name.value,
        ...(subdomain.value === undefined ? {} : { subdomain: subdomain.value }),
        ...(url.value === undefined ? {} : { url: url.value }),
        ...(roleConfig.value === undefined ? {} : { roleConfig: roleConfig.value }),
        ...(metadata.value === undefined ? {} : { metadata: metadata.value }),
      }),
    );
  },
);

export const organizationPersistenceSchema = organizationDtoSchema;
