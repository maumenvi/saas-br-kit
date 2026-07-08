import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { User } from "../../../domain/index.ts";
import type { CoreError, Result } from "../../../errors/result.ts";
import type { ActorAppContext } from "../context/actor-app-context.ts";
import type { ActorByIdInput } from "../input/actor-by-id-input.ts";
import { UpdateActorUseCase } from "./update-actor-use-case.ts";

/** Soft-deletes an actor by disabling the account. */
export class DisableActorUseCase {
  private readonly appContext: ActorAppContext;

  constructor(appContext: ActorAppContext) {
    this.appContext = appContext;
  }

  /** Moves one actor to the disabled lifecycle state. */
  async execute(
    executionContext: ExecutionContext,
    input: ActorByIdInput,
  ): Promise<Result<User, CoreError>> {
    return new UpdateActorUseCase(this.appContext).execute(executionContext, {
      actorId: input.actorId,
      status: "disabled",
    });
  }
}
