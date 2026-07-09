import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { Membership } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { applicationFailureFactory, useCaseRunner } from "../../shared/index.ts";
import { MembershipOrganizationService } from "../service/organizations.ts";
import { MembershipPermissionService } from "../service/permissions.ts";
import type { MembershipAppContext, RemoveOrganizationMemberInput } from "../types.ts";

/**
 * Disables a member inside an organization without deleting membership history.
 */
export class RemoveOrganizationMemberUseCase {
  private readonly appContext: MembershipAppContext;

  /** Stores membership repositories and shared ports required by the removal flow. */
  constructor(appContext: MembershipAppContext) {
    this.appContext = appContext;
  }

  /**
   * Executes member removal while preventing owner removal.
   */
  async execute(
    executionContext: ExecutionContext,
    input: RemoveOrganizationMemberInput,
  ): Promise<Result<Membership, CoreError>> {
    const organizationService = new MembershipOrganizationService(this.appContext);
    const permissionService = new MembershipPermissionService();

    return useCaseRunner.runSafely(async () =>
      this.appContext.transactionManager.runInTransaction(async (transaction) => {
        const organization = await organizationService.findOrganization(input.organizationId);
        if (!organization.ok) {
          return organization;
        }

        const permission = await permissionService.ensureActorMembershipPermission({
          appContext: this.appContext,
          executionContext,
          organization: organization.data,
          permission: "organization:members:remove",
        });
        if (!permission.ok) {
          return permission;
        }

        if (input.userId === organization.data.ownerUserId) {
          return applicationFailureFactory.conflict(
            "membership.owner_cannot_be_removed",
            "The organization owner cannot be removed from the organization.",
            { organizationId: input.organizationId },
          );
        }

        const membership =
          await this.appContext.repositories.memberships.findByOrganizationIdAndUserId(
            {
              organizationId: input.organizationId,
              userId: input.userId,
            },
            { transaction },
          );
        if (membership === null) {
          return applicationFailureFactory.notFound(
            "membership.not_found",
            "Membership was not found.",
            {
              organizationId: input.organizationId,
              userId: input.userId,
            },
          );
        }

        const removed = membership.disable({
          disabledAt: this.appContext.clock.now().toISOString(),
        });
        if (!removed.ok) {
          return removed;
        }

        await this.appContext.repositories.memberships.save(removed.data, { transaction });
        this.appContext.logger.info("Organization member removed.", {
          requestId: executionContext.requestId,
          organizationId: input.organizationId,
          userId: input.userId,
        });

        return ok(removed.data);
      }),
    );
  }
}
