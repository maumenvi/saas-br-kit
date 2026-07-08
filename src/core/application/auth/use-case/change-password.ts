import type { ExecutionContext } from "../../../context/execution-context.ts";
import { UserCredentials } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import {
  executionPolicy,
  sendOptionalEmailNotification,
  useCaseRunner,
} from "../../shared/index.ts";
import { authFailures } from "../service/errors.ts";
import { ActiveUserLoader } from "../service/users.ts";
import type { AuthAppContext, ChangePasswordInput, ChangePasswordResult } from "../types.ts";

/**
 * Changes a user password after validating the current password.
 */
export class ChangePasswordUseCase {
  private readonly appContext: AuthAppContext;

  constructor(appContext: AuthAppContext) {
    this.appContext = appContext;
  }

  async execute(
    executionContext: ExecutionContext,
    input: ChangePasswordInput,
  ): Promise<Result<ChangePasswordResult, CoreError>> {
    const access = executionPolicy.ensureActorCanRepresentUser(executionContext, input.actorId);
    if (!access.ok) {
      return access;
    }

    const userLoader = new ActiveUserLoader(this.appContext);
    return useCaseRunner.runSafely(async () =>
      this.appContext.transactionManager.runInTransaction(async (transaction) => {
        const user = await userLoader.load(input.actorId);
        if (!user.ok) {
          return user;
        }

        const currentCredentials = await this.appContext.auth.userCredentials.findByEmail(
          user.data.email,
          { transaction },
        );
        if (currentCredentials === null || currentCredentials.status !== "active") {
          return authFailures.invalidCredentials();
        }

        const currentPasswordValid = await this.appContext.auth.passwordHasher.verifyPassword({
          password: input.currentPassword,
          passwordHash: currentCredentials.passwordHash,
        });
        if (!currentPasswordValid) {
          return authFailures.invalidCredentials();
        }

        const now = this.appContext.clock.now().toISOString();
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

        this.appContext.logger.info("Actor password changed.", {
          requestId: executionContext.requestId,
          actorId: input.actorId,
        });

        await sendOptionalEmailNotification(this.appContext, "sendPasswordChangedEmail", {
          to: user.data.email,
          userId: user.data.id,
          ...(user.data.displayName === undefined ? {} : { displayName: user.data.displayName }),
          changedAt: now,
        });

        return ok(Object.freeze({ changed: true }));
      }),
    );
  }
}
