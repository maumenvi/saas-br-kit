import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { User } from "../../../domain/index.ts";
import { CoreFunctionalityNotConfiguredError } from "../../../errors/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import type { RepositoryOperationOptions } from "../../../ports/repositories/options.ts";
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
      const actor = await this.findUserById(input.actorId);
      return actor === null
        ? applicationFailureFactory.notFound("actor.not_found", "Actor was not found.")
        : ok(actor);
    });
  }

  private async findUserById(userId: string, options?: RepositoryOperationOptions) {
    const capability = this.appContext.auth.capabilities?.users?.findUserById;
    if (capability !== undefined) {
      return capability(userId, options);
    }
    if (this.appContext.auth.users !== undefined) {
      return this.appContext.auth.users.findById(userId, options);
    }
    throw new CoreFunctionalityNotConfiguredError("auth.capabilities.users.findUserById");
  }
}
