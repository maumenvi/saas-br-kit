import type { CoreError, Result } from "../../errors/result.ts";

export type AuthenticateIdentityInput = Readonly<{
  email: string;
  password: string;
}>;

export type AuthenticatedIdentity = Readonly<{
  userId: string;
}>;

export type IdentityAuthenticatorPort = Readonly<{
  authenticateIdentity(
    input: AuthenticateIdentityInput,
  ): Promise<Result<AuthenticatedIdentity, CoreError>>;
}>;
