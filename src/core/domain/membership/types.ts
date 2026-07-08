import type { MembershipId, OrganizationId } from "../index.ts";
import type { TimestampInput } from "../validation/index.ts";
import type { MembershipRole, MembershipStatus } from "./constants.ts";

export type MembershipProps = Readonly<{
  id: MembershipId;
  organizationId: OrganizationId;
  userId: string;
  role: MembershipRole;
  status: MembershipStatus;
  createdAt: string;
  updatedAt: string;
  invitedByUserId?: string;
}>;

export type CreateMembershipEntityInput = Readonly<{
  id: MembershipId;
  organizationId: OrganizationId;
  userId: string;
  role: MembershipRole;
  status?: MembershipStatus;
  createdAt: TimestampInput;
  updatedAt?: TimestampInput;
  invitedByUserId?: string;
}>;

export type ActivateMembershipInput = Readonly<{
  acceptedAt: TimestampInput;
}>;

export type ChangeMembershipRoleInput = Readonly<{
  role: MembershipRole;
  updatedAt: TimestampInput;
}>;

export type DisableMembershipInput = Readonly<{
  disabledAt: TimestampInput;
}>;
