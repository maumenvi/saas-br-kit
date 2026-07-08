import { emailNormalizer } from "../../../domain/validation/index.ts";
import type { CoreError, Result } from "../../../errors/result.ts";
import type { AuthenticatedIdentity, IdentityAuthenticatorPort } from "../../../ports/index.ts";
import type { AuthAppContext } from "../types.ts";
import { authFailures } from "./errors.ts";

/**
 * Backward-compatible identity authenticator based on local credentials/password.
 */
export class PasswordIdentityAuthenticator implements IdentityAuthenticatorPort {
  private readonly appContext: AuthAppContext;

  constructor(appContext: AuthAppContext) {
    this.appContext = appContext;
  }

  async authenticateIdentity(
    input: Readonly<{ email: string; password: string }>,
  ): Promise<Result<AuthenticatedIdentity, CoreError>> {
    const email = emailNormalizer.normalize("auth.email", input.email);
    if (!email.ok) {
      return email;
    }

    const credentials = await this.appContext.auth.userCredentials.findByEmail(email.data);
    if (credentials === null || credentials.status !== "active") {
      return authFailures.invalidCredentials();
    }

    const passwordValid = await this.appContext.auth.passwordHasher.verifyPassword({
      password: input.password,
      passwordHash: credentials.passwordHash,
    });
    if (!passwordValid) {
      return authFailures.invalidCredentials();
    }

    return { ok: true, data: Object.freeze({ userId: credentials.userId }) };
  }
}
