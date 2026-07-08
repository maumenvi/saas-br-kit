import type { ExecutionContext } from "../../../context/execution-context.ts";
import { Organization } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { executionPolicy, useCaseRunner } from "../../shared/index.ts";
import type { CreateOrganizationAppContext } from "../context/create-organization-app-context.ts";
import type { CreateOrganizationInput } from "../input/create-organization-input.ts";

/** Creates organizations for actors allowed to represent the owner user. */
export class CreateOrganizationUseCase {
  private readonly appContext: CreateOrganizationAppContext;

  /** Stores the ports required to persist organizations. */
  constructor(appContext: CreateOrganizationAppContext) {
    this.appContext = appContext;
  }

  /** Executes organization creation inside a transaction. */
  async execute(
    executionContext: ExecutionContext,
    input: CreateOrganizationInput,
  ): Promise<Result<Organization, CoreError>> {
    const actor = executionPolicy.ensureActorCanRepresentUser(executionContext, input.ownerUserId);
    if (!actor.ok) {
      return actor;
    }

    return useCaseRunner.runSafely(async () =>
      this.appContext.transactionManager.runInTransaction(async (transaction) => {
        const now = this.appContext.clock.now().toISOString();
        const organization = Organization.create({
          id: this.appContext.idGenerator.newId(),
          ownerUserId: input.ownerUserId,
          name: input.name,
          createdAt: now,
          ...(input.subdomain === undefined ? {} : { subdomain: input.subdomain }),
          ...(input.url === undefined ? {} : { url: input.url }),
          ...(input.roleConfig === undefined ? {} : { roleConfig: input.roleConfig }),
          ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
        });

        if (!organization.ok) {
          return organization;
        }

        await this.appContext.repositories.organizations.save(organization.data, { transaction });

        this.appContext.logger.info("Organization created.", {
          requestId: executionContext.requestId,
          organizationId: organization.data.id,
        });

        return ok(organization.data);
      }),
    );
  }
}
