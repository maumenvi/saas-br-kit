import type { ExecutionContext } from "../../../context/execution-context.ts";
import { User, UserCredentials } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
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
          (await this.appContext.auth.users.findByEmail(input.email, { transaction })) !== null ||
          (await this.appContext.auth.userCredentials.findByEmail(input.email, {
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
        await this.appContext.auth.users.save(user.data, { transaction });
        await this.appContext.auth.userCredentials.save(credentials.data, { transaction });
        return ok(user.data);
      }),
    );
  }
}
