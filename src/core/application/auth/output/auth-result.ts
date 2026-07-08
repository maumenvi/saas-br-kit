import type { User } from "../../../domain/index.ts";
import type { AuthenticatedOrganizationAccess } from "./authenticated-organization-access.ts";

export type AuthResult = Readonly<{
  user: User;
  accessToken: string;
  accessTokenExpiresAt?: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  refreshTokenSessionId: string;
  organizations?: readonly AuthenticatedOrganizationAccess[];
}>;
