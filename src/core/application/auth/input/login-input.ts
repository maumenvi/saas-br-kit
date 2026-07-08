import type { AccessTokenMembershipClaim } from "../../../ports/index.ts";

export type LoginInput = Readonly<{
  email: string;
  password: string;
  deviceId?: string;
  organizationUrl?: string | null;
  memberships?: readonly AccessTokenMembershipClaim[];
}>;
