import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { User } from "../../../domain/index.ts";
import { CoreFunctionalityNotConfiguredError } from "../../../errors/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import type { RepositoryOperationOptions } from "../../../ports/repositories/options.ts";
import { executionPolicy, useCaseRunner } from "../../shared/index.ts";
import type { ActorAppContext } from "../context/actor-app-context.ts";

/** Lists actors for administrative contexts. */
export class ListActorsUseCase {
  private readonly appContext: ActorAppContext;

  constructor(appContext: ActorAppContext) {
    this.appContext = appContext;
  }

  /** Returns all actors after validating administrative read access. */
  async execute(executionContext: ExecutionContext): Promise<Result<readonly User[], CoreError>> {
    const permission = executionPolicy.ensurePermission(executionContext, "actors:read");
    if (!permission.ok) {
      return permission;
    }
    return useCaseRunner.runSafely(async () => ok(await this.listUsers()));
  }

  private async listUsers(options?: RepositoryOperationOptions): Promise<readonly User[]> {
    const capability = this.appContext.auth.capabilities?.users?.listUsers;
    if (capability !== undefined) {
      return capability(options);
    }
    if (this.appContext.auth.users !== undefined) {
      return this.appContext.auth.users.list(options);
    }
    throw new CoreFunctionalityNotConfiguredError("auth.capabilities.users.listUsers");
  }
}
