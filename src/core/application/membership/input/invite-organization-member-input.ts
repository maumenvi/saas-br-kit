import type { MembershipRole, OrganizationId } from "../../../domain/index.ts";

export type InviteOrganizationMemberInput = Readonly<{
  organizationId: OrganizationId;
  userId: string;
  role: MembershipRole;
}>;
