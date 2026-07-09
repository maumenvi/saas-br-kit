import type { MembershipRole, OrganizationId } from "../../../domain/index.ts";

export type ChangeOrganizationMemberRoleInput = Readonly<{
  organizationId: OrganizationId;
  userId: string;
  role: MembershipRole;
}>;
