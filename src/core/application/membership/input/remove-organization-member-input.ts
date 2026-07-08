import type { OrganizationId } from "../../../domain/index.ts";

export type RemoveOrganizationMemberInput = Readonly<{
  organizationId: OrganizationId;
  userId: string;
}>;
