import type { ExecutionContext } from "../../../context/execution-context.ts";
import { Organization } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { executionPolicy, useCaseRunner } from "../../shared/index.ts";
import type { CreateOrganizationAppContext } from "../context/create-organization-app-context.ts";
import type { OrganizationByIdInput } from "../input/organization-by-id-input.ts";

/** Soft-deletes an organization by moving it to the inactive lifecycle state. */
export class DisableOrganizationUseCase {
  private readonly appContext: CreateOrganizationAppContext;

  constructor(appContext: CreateOrganizationAppContext) {
    this.appContext = appContext;
  }

  /** Moves one organization to the disabled lifecycle state. */
  async execute(
    executionContext: ExecutionContext,
    input: OrganizationByIdInput,
  ): Promise<Result<Organization, CoreError>> {
    return useCaseRunner.runSafely(async () =>
      this.appContext.transactionManager.runInTransaction(async (transaction) => {
        const current = await this.appContext.repositories.organizations.findById(
          input.organizationId,
          { transaction },
        );
        if (current === null) {
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
          current.ownerUserId,
        );
        if (!actor.ok) {
          return actor;
        }
        const deleted = Organization.create({
          id: current.id,
          ownerUserId: current.ownerUserId,
          name: current.name,
          status: "disabled",
          createdAt: current.createdAt,
          updatedAt: this.appContext.clock.now(),
          ...(current.subdomain === undefined ? {} : { subdomain: current.subdomain }),
          ...(current.url === undefined ? {} : { url: current.url }),
          roleConfig: current.roleConfig,
          ...(current.metadata === undefined ? {} : { metadata: current.metadata }),
        });
        if (!deleted.ok) {
          return deleted;
        }
        await this.appContext.repositories.organizations.save(deleted.data, { transaction });
        return ok(deleted.data);
      }),
    );
  }
}
