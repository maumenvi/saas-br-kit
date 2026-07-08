import type { OrganizationId } from "../../../domain/index.ts";

export type AcceptOrganizationInvitationInput = Readonly<{
  organizationId: OrganizationId;
}>;
