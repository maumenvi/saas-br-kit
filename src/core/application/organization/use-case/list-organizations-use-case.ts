import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { Organization } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { executionPolicy, useCaseRunner } from "../../shared/index.ts";
import type { CreateOrganizationAppContext } from "../context/create-organization-app-context.ts";
import type { ListOrganizationsInput } from "../input/list-organizations-input.ts";

/** Lists organizations owned by the represented user. */
export class ListOrganizationsUseCase {
  private readonly appContext: CreateOrganizationAppContext;

  constructor(appContext: CreateOrganizationAppContext) {
    this.appContext = appContext;
  }

  /** Returns organizations owned by a represented user. */
  async execute(
    executionContext: ExecutionContext,
    input: ListOrganizationsInput,
  ): Promise<Result<readonly Organization[], CoreError>> {
    const actor = executionPolicy.ensureActorCanRepresentUser(executionContext, input.ownerUserId);
    if (!actor.ok) {
      return actor;
    }
    return useCaseRunner.runSafely(async () => {
      const listByOwnerUserId = this.appContext.repositories.organizations.listByOwnerUserId?.bind(
        this.appContext.repositories.organizations,
      );
      if (listByOwnerUserId === undefined) {
        return {
          ok: false,
          error: {
            kind: "infrastructure",
            code: "organization.list_unsupported",
            message: "Organization repository does not support listing.",
          },
        };
      }
      return ok(await listByOwnerUserId(input.ownerUserId));
    });
  }
}
