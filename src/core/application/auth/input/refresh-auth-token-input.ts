import type { AccessTokenMembershipClaim } from "../../../ports/index.ts";

export type RefreshAuthTokenInput = Readonly<{
  refreshToken: string;
  deviceId?: string;
  memberships?: readonly AccessTokenMembershipClaim[];
}>;
