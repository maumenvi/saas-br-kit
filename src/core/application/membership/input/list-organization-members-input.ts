import type { OrganizationId } from "../../../domain/index.ts";

export type ListOrganizationMembersInput = Readonly<{
  organizationId: OrganizationId;
}>;
