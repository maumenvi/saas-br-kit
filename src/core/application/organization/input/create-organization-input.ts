import type { OrganizationRoleConfigInput, SafeMetadata } from "../../../domain/index.ts";

export type CreateOrganizationInput = Readonly<{
  ownerUserId: string;
  name: string;
  subdomain?: string;
  url?: string;
  roleConfig?: OrganizationRoleConfigInput;
  metadata?: SafeMetadata;
}>;
