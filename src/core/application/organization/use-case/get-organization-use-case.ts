import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { Organization } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { executionPolicy, useCaseRunner } from "../../shared/index.ts";
import type { CreateOrganizationAppContext } from "../context/create-organization-app-context.ts";
import type { OrganizationByIdInput } from "../input/organization-by-id-input.ts";

/** Reads one organization after validating its owner or tenant scope. */
export class GetOrganizationUseCase {
  private readonly appContext: CreateOrganizationAppContext;

  constructor(appContext: CreateOrganizationAppContext) {
    this.appContext = appContext;
  }

  /** Returns one organization visible to the represented user. */
  async execute(
    executionContext: ExecutionContext,
    input: OrganizationByIdInput,
  ): Promise<Result<Organization, CoreError>> {
    return useCaseRunner.runSafely(async () => {
      const organization = await this.appContext.repositories.organizations.findById(
        input.organizationId,
      );
      if (organization === null) {
        return {
          ok: false,
          error: {
            kind: "not_found",
            code: "organization.not_found",
            message: "Organization was not found.",
          },
        };
      }
      const actor = executionPolicy.ensureActorCanRepresentUser(
        executionContext,
        organization.ownerUserId,
      );
      return actor.ok ? ok(organization) : actor;
    });
  }
}
