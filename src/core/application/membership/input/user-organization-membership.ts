import type { Membership, Organization } from "../../../domain/index.ts";

export type UserOrganizationMembership = Readonly<{
  organization: Organization;
  membership: Membership;
}>;
