import type { ExecutionContext } from "../../../context/execution-context.ts";
import { User, UserCredentials } from "../../../domain/index.ts";
import { CoreFunctionalityNotConfiguredError } from "../../../errors/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import type { RepositoryOperationOptions } from "../../../ports/repositories/options.ts";
import { applicationFailureFactory, useCaseRunner } from "../../shared/index.ts";
import type { ActorAppContext } from "../context/actor-app-context.ts";
import { ensureActorWrite } from "../ensure-actor-write.ts";
import type { CreateActorInput } from "../input/create-actor-input.ts";

/** Creates an actor and password credentials atomically. */
export class CreateActorUseCase {
  private readonly appContext: ActorAppContext;

  constructor(appContext: ActorAppContext) {
    this.appContext = appContext;
  }

  /** Persists a new actor after validating administrative write access. */
  async execute(
    executionContext: ExecutionContext,
    input: CreateActorInput,
  ): Promise<Result<User, CoreError>> {
    const permission = ensureActorWrite(executionContext);
    if (!permission.ok) {
      return permission;
    }
    return useCaseRunner.runSafely(async () =>
      this.appContext.transactionManager.runInTransaction(async (transaction) => {
        if (
          (await this.findUserByEmail(input.email, { transaction })) !== null ||
          (await this.findCredentialsByEmail(input.email, {
            transaction,
          })) !== null
        ) {
          return applicationFailureFactory.conflict(
            "actor.email_conflict",
            "An actor with this email already exists.",
          );
        }
        const now = this.appContext.clock.now().toISOString();
        const user = User.create({
          id: this.appContext.idGenerator.newId(),
          email: input.email,
          createdAt: now,
          ...(input.displayName === undefined ? {} : { displayName: input.displayName }),
        });
        if (!user.ok) {
          return user;
        }
        const passwordHash = await this.appContext.auth.passwordHasher.hashPassword(input.password);
        const credentials = UserCredentials.create({
          userId: user.data.id,
          email: user.data.email,
          passwordHash,
          createdAt: now,
        });
        if (!credentials.ok) {
          return credentials;
        }
        await this.insertUser(user.data, { transaction });
        await this.insertCredentials(credentials.data, { transaction });
        return ok(user.data);
      }),
    );
  }

  private async findUserByEmail(email: string, options?: RepositoryOperationOptions) {
    const capability = this.appContext.auth.capabilities?.users?.findUserByEmail;
    if (capability !== undefined) {
      return capability(email, options);
    }
    if (this.appContext.auth.users !== undefined) {
      return this.appContext.auth.users.findByEmail(email, options);
    }
    throw new CoreFunctionalityNotConfiguredError("auth.capabilities.users.findUserByEmail");
  }

  private async findCredentialsByEmail(email: string, options?: RepositoryOperationOptions) {
    const capability = this.appContext.auth.capabilities?.userCredentials?.findCredentialsByEmail;
    if (capability !== undefined) {
      return capability(email, options);
    }
    if (this.appContext.auth.userCredentials !== undefined) {
      return this.appContext.auth.userCredentials.findByEmail(email, options);
    }
    throw new CoreFunctionalityNotConfiguredError(
      "auth.capabilities.userCredentials.findCredentialsByEmail",
    );
  }

  private async insertUser(user: User, options?: RepositoryOperationOptions): Promise<void> {
    const capability = this.appContext.auth.capabilities?.users?.insertUser;
    if (capability !== undefined) {
      await capability(user, options);
      return;
    }
    if (this.appContext.auth.users !== undefined) {
      await this.appContext.auth.users.save(user, options);
      return;
    }
    throw new CoreFunctionalityNotConfiguredError("auth.capabilities.users.insertUser");
  }

  private async insertCredentials(
    credentials: UserCredentials,
    options?: RepositoryOperationOptions,
  ): Promise<void> {
    const capability = this.appContext.auth.capabilities?.userCredentials?.insertCredentials;
    if (capability !== undefined) {
      await capability(credentials, options);
      return;
    }
    if (this.appContext.auth.userCredentials !== undefined) {
      await this.appContext.auth.userCredentials.save(credentials, options);
      return;
    }
    throw new CoreFunctionalityNotConfiguredError("auth.capabilities.userCredentials.insertCredentials");
  }
}
