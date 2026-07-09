import type { OrganizationRoleConfigInput, SafeMetadata } from "../../../domain/index.ts";

export type UpdateOrganizationInput = Readonly<{
  organizationId: string;
  name?: string;
  subdomain?: string | null;
  url?: string | null;
  roleConfig?: OrganizationRoleConfigInput;
  metadata?: SafeMetadata | null;
}>;
