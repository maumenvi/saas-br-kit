import type { ExecutionContext } from "../../../context/execution-context.ts";
import { User } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { applicationFailureFactory, executionPolicy, useCaseRunner } from "../../shared/index.ts";
import type { ActorAppContext } from "../context/actor-app-context.ts";
import { ensureActorWrite } from "../ensure-actor-write.ts";
import type { UpdateActorInput } from "../input/update-actor-input.ts";

/** Updates actor profile and lifecycle fields. */
export class UpdateActorUseCase {
  private readonly appContext: ActorAppContext;

  constructor(appContext: ActorAppContext) {
    this.appContext = appContext;
  }

  /** Persists mutable actor fields after validating self-service or administrative access. */
  async execute(
    executionContext: ExecutionContext,
    input: UpdateActorInput,
  ): Promise<Result<User, CoreError>> {
    const access = executionPolicy.ensureActorCanRepresentUser(executionContext, input.actorId);
    if (!access.ok) {
      const permission = ensureActorWrite(executionContext);
      if (!permission.ok) {
        return access;
      }
    }
    return useCaseRunner.runSafely(async () =>
      this.appContext.transactionManager.runInTransaction(async (transaction) => {
        const current = await this.appContext.auth.users.findById(input.actorId, { transaction });
        if (current === null) {
          return applicationFailureFactory.notFound("actor.not_found", "Actor was not found.");
        }
        const updated = User.create({
          id: current.id,
          email: current.email,
          status: input.status ?? current.status,
          createdAt: current.createdAt,
          updatedAt: this.appContext.clock.now(),
          ...(input.displayName === null
            ? {}
            : { displayName: input.displayName ?? current.displayName }),
        });
        if (!updated.ok) {
          return updated;
        }
        await this.appContext.auth.users.save(updated.data, { transaction });
        return ok(updated.data);
      }),
    );
  }
}
