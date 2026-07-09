import type { ExecutionContext } from "../../../context/execution-context.ts";
import { Organization } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { executionPolicy, useCaseRunner } from "../../shared/index.ts";
import type { CreateOrganizationAppContext } from "../context/create-organization-app-context.ts";
import type { UpdateOrganizationInput } from "../input/update-organization-input.ts";

/** Updates mutable organization fields while preserving identity and creation time. */
export class UpdateOrganizationUseCase {
  private readonly appContext: CreateOrganizationAppContext;

  constructor(appContext: CreateOrganizationAppContext) {
    this.appContext = appContext;
  }

  /** Persists mutable fields for an organization visible to the represented user. */
  async execute(
    executionContext: ExecutionContext,
    input: UpdateOrganizationInput,
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
        const updated = Organization.create({
          id: current.id,
          ownerUserId: current.ownerUserId,
          name: input.name ?? current.name,
          status: current.status,
          createdAt: current.createdAt,
          updatedAt: this.appContext.clock.now(),
          ...(input.subdomain === null ? {} : { subdomain: input.subdomain ?? current.subdomain }),
          ...(input.url === null ? {} : { url: input.url ?? current.url }),
          roleConfig: input.roleConfig ?? current.roleConfig,
          ...(input.metadata === null ? {} : { metadata: input.metadata ?? current.metadata }),
        });
        if (!updated.ok) {
          return updated;
        }
        await this.appContext.repositories.organizations.save(updated.data, { transaction });
        return ok(updated.data);
      }),
    );
  }
}
