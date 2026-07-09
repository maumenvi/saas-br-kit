import type { ExecutionContext } from "../../../context/execution-context.ts";
import { UserCredentials } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import {
  applicationFailureFactory,
  sendOptionalEmailNotification,
  useCaseRunner,
} from "../../shared/index.ts";
import { ActiveUserLoader } from "../service/users.ts";
import type { AuthAppContext, ResetPasswordInput, ResetPasswordResult } from "../types.ts";

/**
 * Resets a password using a previously issued reset token.
 */
export class ResetPasswordUseCase {
  private readonly appContext: AuthAppContext;

  constructor(appContext: AuthAppContext) {
    this.appContext = appContext;
  }

  async execute(
    executionContext: ExecutionContext,
    input: ResetPasswordInput,
  ): Promise<Result<ResetPasswordResult, CoreError>> {
    const userLoader = new ActiveUserLoader(this.appContext);

    return useCaseRunner.runSafely(async () =>
      this.appContext.transactionManager.runInTransaction(async (transaction) => {
        const tokenStore = this.appContext.auth.passwordResetTokens;
        if (tokenStore === undefined) {
          return applicationFailureFactory.authorization(
            "auth.password_reset_unavailable",
            "Password reset is not available.",
          );
        }

        const secretHash = await this.appContext.auth.refreshTokens.hashSecret(input.token);
        const record = await tokenStore.findBySecretHash(secretHash, { transaction });
        if (record === null || record.consumedAt !== undefined) {
          return applicationFailureFactory.authorization(
            "auth.password_reset_token_invalid",
            "Password reset token is invalid.",
          );
        }

        const now = this.appContext.clock.now().toISOString();
        if (Date.parse(record.expiresAt) <= Date.parse(now)) {
          return applicationFailureFactory.authorization(
            "auth.password_reset_token_expired",
            "Password reset token is expired.",
          );
        }

        const user = await userLoader.load(record.userId);
        if (!user.ok) {
          return user;
        }

        const currentCredentials = await this.appContext.auth.userCredentials.findByEmail(
          user.data.email,
          { transaction },
        );
        if (currentCredentials === null || currentCredentials.status !== "active") {
          return applicationFailureFactory.authorization(
            "auth.password_reset_token_invalid",
            "Password reset token is invalid.",
          );
        }

        const passwordHash = await this.appContext.auth.passwordHasher.hashPassword(
          input.newPassword,
        );
        const updatedCredentials = UserCredentials.create({
          userId: currentCredentials.userId,
          email: currentCredentials.email,
          passwordHash,
          status: currentCredentials.status,
          createdAt: currentCredentials.createdAt,
          updatedAt: now,
        });
        if (!updatedCredentials.ok) {
          return updatedCredentials;
        }

        await this.appContext.auth.userCredentials.save(updatedCredentials.data, { transaction });
        await tokenStore.save(
          Object.freeze({
            ...record,
            consumedAt: now,
          }),
          { transaction },
        );

        await sendOptionalEmailNotification(this.appContext, "sendPasswordChangedEmail", {
          to: user.data.email,
          userId: user.data.id,
          ...(user.data.displayName === undefined ? {} : { displayName: user.data.displayName }),
          changedAt: now,
        });

        this.appContext.logger.info("Password reset completed.", {
          requestId: executionContext.requestId,
          userId: user.data.id,
        });

        return ok(Object.freeze({ changed: true }));
      }),
    );
  }
}
