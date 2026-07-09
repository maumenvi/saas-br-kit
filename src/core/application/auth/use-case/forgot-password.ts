import { randomBytes } from "node:crypto";
import type { ExecutionContext } from "../../../context/execution-context.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { sendOptionalEmailNotification, useCaseRunner } from "../../shared/index.ts";
import type { AuthAppContext, ForgotPasswordInput, ForgotPasswordResult } from "../types.ts";

const resetTokenLifetimeMs = 60 * 60 * 1000;

/**
 * Requests a password reset token and sends the reset email when possible.
 */
export class ForgotPasswordUseCase {
  private readonly appContext: AuthAppContext;

  constructor(appContext: AuthAppContext) {
    this.appContext = appContext;
  }

  async execute(
    executionContext: ExecutionContext,
    input: ForgotPasswordInput,
  ): Promise<Result<ForgotPasswordResult, CoreError>> {
    return useCaseRunner.runSafely(async () =>
      this.appContext.transactionManager.runInTransaction(async (transaction) => {
        const credentials = await this.appContext.auth.userCredentials.findByEmail(input.email, {
          transaction,
        });
        if (credentials === null || credentials.status !== "active") {
          return ok(Object.freeze({ requested: true }));
        }

        const user = await this.appContext.auth.users.findById(credentials.userId, { transaction });
        if (user === null || user.status !== "active") {
          return ok(Object.freeze({ requested: true }));
        }

        const tokenStore = this.appContext.auth.passwordResetTokens;
        if (tokenStore === undefined) {
          this.appContext.logger.error("Password reset token store is not configured.", {
            requestId: executionContext.requestId,
            userId: user.id,
          });
          return ok(Object.freeze({ requested: true }));
        }

        const now = this.appContext.clock.now().toISOString();
        const rawToken = randomBytes(32).toString("base64url");
        const secretHash = await this.appContext.auth.refreshTokens.hashSecret(rawToken);
        await tokenStore.save(
          Object.freeze({
            id: this.appContext.idGenerator.newId(),
            userId: user.id,
            secretHash,
            expiresAt: new Date(Date.parse(now) + resetTokenLifetimeMs).toISOString(),
            createdAt: now,
          }),
          { transaction },
        );

        const resetUrl =
          input.resetUrlBase === undefined
            ? undefined
            : new URL(
                rawToken,
                input.resetUrlBase.endsWith("/") ? input.resetUrlBase : `${input.resetUrlBase}/`,
              ).toString();

        await sendOptionalEmailNotification(this.appContext, "sendPasswordResetRequestedEmail", {
          to: user.email,
          userId: user.id,
          ...(user.displayName === undefined ? {} : { displayName: user.displayName }),
          token: rawToken,
          ...(resetUrl === undefined ? {} : { resetUrl }),
          expiresAt: new Date(Date.parse(now) + resetTokenLifetimeMs).toISOString(),
        });

        this.appContext.logger.info("Password reset requested.", {
          requestId: executionContext.requestId,
          userId: user.id,
        });

        return ok(Object.freeze({ requested: true }));
      }),
    );
  }
}
