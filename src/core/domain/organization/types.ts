import type { OrganizationId } from "../index.ts";
import type { SafeMetadata } from "../metadata/index.ts";
import type { TimestampInput } from "../validation/index.ts";
import type { OrganizationStatus } from "./status.ts";

export type OrganizationEmployeeRole = Readonly<{
  name: string;
  permissions: readonly string[];
}>;

export type OrganizationRoleConfig = Readonly<{
  ownerRoleName: string;
  employeeRoles: readonly OrganizationEmployeeRole[];
}>;

export type OrganizationRoleConfigInput = Readonly<{
  ownerRoleName?: string;
  employeeRoles?: readonly OrganizationEmployeeRole[];
}>;

export type OrganizationProps = Readonly<{
  id: OrganizationId;
  ownerUserId: string;
  name: string;
  status: OrganizationStatus;
  createdAt: string;
  updatedAt: string;
  subdomain?: string;
  url?: string;
  roleConfig: OrganizationRoleConfig;
  metadata?: SafeMetadata;
}>;

export type CreateOrganizationEntityInput = Readonly<{
  id: OrganizationId;
  ownerUserId: string;
  name: string;
  status?: OrganizationStatus;
  createdAt: TimestampInput;
  updatedAt?: TimestampInput;
  subdomain?: string;
  url?: string;
  roleConfig?: OrganizationRoleConfigInput;
  metadata?: SafeMetadata;
}>;
