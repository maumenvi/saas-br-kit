import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { CoreError, Result } from "../../../errors/result.ts";
import { ok } from "../../../errors/result.ts";
import { useCaseRunner } from "../../shared/index.ts";
import { AuthenticatedOrganizationAccessService } from "../service/organization-access.ts";
import { PasswordIdentityAuthenticator } from "../service/password-identity-authenticator.ts";
import { AuthSessionService } from "../service/sessions.ts";
import { ActiveUserLoader } from "../service/users.ts";
import type { AuthAppContext, AuthResult, LoginInput } from "../types.ts";

/**
 * Authenticates users with email/password and issues session tokens.
 */
export class LoginWithPasswordUseCase {
  private readonly appContext: AuthAppContext;

  /** Stores auth ports and shared application services. */
  constructor(appContext: AuthAppContext) {
    this.appContext = appContext;
  }

  /**
   * Executes the login flow and logs only non-secret token metadata.
   */
  async execute(
    executionContext: ExecutionContext,
    input: LoginInput,
  ): Promise<Result<AuthResult, CoreError>> {
    const sessionService = new AuthSessionService(this.appContext);
    const userLoader = new ActiveUserLoader(this.appContext);

    return useCaseRunner.runSafely(async () =>
      this.appContext.transactionManager.runInTransaction(async () => {
        const authenticatedIdentity = await this.resolveAuthenticator().authenticateIdentity({
          email: input.email,
          password: input.password,
        });
        if (!authenticatedIdentity.ok) {
          return authenticatedIdentity;
        }

        const user = await userLoader.load(authenticatedIdentity.data.userId);
        if (!user.ok) {
          return user;
        }

        const issuedAt = this.appContext.clock.now().toISOString();
        const organizationAccess = await new AuthenticatedOrganizationAccessService(
          this.appContext,
        ).resolve(user.data.id, input.organizationUrl);
        if (!organizationAccess.ok) {
          return organizationAccess;
        }
        const memberships =
          organizationAccess.data === undefined
            ? input.memberships
            : organizationAccess.data.map((access) => ({
                organizationId: access.organizationId,
                role: access.role,
                status: "active",
              }));
        const result = await sessionService.issueAuthResult({
          user: user.data,
          issuedAt,
          ...(input.deviceId === undefined ? {} : { deviceId: input.deviceId }),
          ...(memberships === undefined ? {} : { memberships }),
        });
        if (!result.ok) {
          return result;
        }

        this.appContext.logger.info("User authenticated.", {
          requestId: executionContext.requestId,
          userId: user.data.id,
          refreshTokenSessionId: result.data.refreshTokenSessionId,
        });

        return organizationAccess.data === undefined
          ? result
          : ok(Object.freeze({ ...result.data, organizations: organizationAccess.data }));
      }),
    );
  }

  private resolveAuthenticator() {
    return (
      this.appContext.auth.identityAuthenticator ??
      new PasswordIdentityAuthenticator(this.appContext)
    );
  }
}
