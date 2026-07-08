import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { User } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
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
    return useCaseRunner.runSafely(async () => ok(await this.appContext.auth.users.list()));
  }
}
