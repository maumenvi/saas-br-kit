import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { User } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { applicationFailureFactory, executionPolicy, useCaseRunner } from "../../shared/index.ts";
import type { ActorAppContext } from "../context/actor-app-context.ts";
import type { ActorByIdInput } from "../input/actor-by-id-input.ts";

/** Reads an actor visible to itself or a system actor. */
export class GetActorUseCase {
  private readonly appContext: ActorAppContext;

  constructor(appContext: ActorAppContext) {
    this.appContext = appContext;
  }

  /** Returns one actor after validating representation access. */
  async execute(
    executionContext: ExecutionContext,
    input: ActorByIdInput,
  ): Promise<Result<User, CoreError>> {
    const access = executionPolicy.ensureActorCanRepresentUser(executionContext, input.actorId);
    if (!access.ok) {
      return access;
    }
    return useCaseRunner.runSafely(async () => {
      const actor = await this.appContext.auth.users.findById(input.actorId);
      return actor === null
        ? applicationFailureFactory.notFound("actor.not_found", "Actor was not found.")
        : ok(actor);
    });
  }
}
