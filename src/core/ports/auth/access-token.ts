import type { User } from "../../domain/index.ts";
import type { Result } from "../../errors/result.ts";

export type AccessTokenMembershipClaim = Readonly<{
  organizationId: string;
  role: string;
  status: string;
}>;

export type IssueAccessTokenInput = Readonly<{
  user: User;
  issuedAt: string;
  memberships?: readonly AccessTokenMembershipClaim[];
}>;

export type IssueAccessTokenResult = Readonly<{
  accessToken: string;
  expiresAt?: string;
}>;

export type VerifiedAccessToken = Readonly<{
  userId: string;
  email?: string;
  memberships?: readonly AccessTokenMembershipClaim[];
  expiresAt?: string;
}>;

export type AccessTokenServicePort = Readonly<{
  issueAccessToken(input: IssueAccessTokenInput): Promise<Result<IssueAccessTokenResult>>;
  verifyAccessToken?(token: string): Promise<Result<VerifiedAccessToken>>;
}>;
