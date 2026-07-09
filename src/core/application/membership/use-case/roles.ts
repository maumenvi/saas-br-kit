import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { Membership } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { applicationFailureFactory, useCaseRunner } from "../../shared/index.ts";
import { MembershipOrganizationService } from "../service/organizations.ts";
import { MembershipPermissionService } from "../service/permissions.ts";
import type { ChangeOrganizationMemberRoleInput, MembershipAppContext } from "../types.ts";

/**
 * Changes a member role within an organization.
 */
export class ChangeOrganizationMemberRoleUseCase {
  private readonly appContext: MembershipAppContext;

  /** Stores membership repositories and shared ports required by the role flow. */
  constructor(appContext: MembershipAppContext) {
    this.appContext = appContext;
  }

  /**
   * Executes the role change while protecting the organization owner role.
   */
  async execute(
    executionContext: ExecutionContext,
    input: ChangeOrganizationMemberRoleInput,
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
          permission: "organization:roles:write",
        });
        if (!permission.ok) {
          return permission;
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

        if (
          membership.userId === organization.data.ownerUserId &&
          input.role !== organization.data.roleConfig.ownerRoleName
        ) {
          return applicationFailureFactory.conflict(
            "membership.owner_role_required",
            "The organization owner must keep owner role.",
            { organizationId: input.organizationId },
          );
        }

        if (
          input.role !== organization.data.roleConfig.ownerRoleName &&
          !organization.data.roleConfig.employeeRoles.some((role) => role.name === input.role)
        ) {
          return applicationFailureFactory.notFound(
            "membership.role_not_found",
            "Role is not configured for this organization.",
          );
        }

        const updated = membership.changeRole({
          role: input.role,
          updatedAt: this.appContext.clock.now().toISOString(),
        });
        if (!updated.ok) {
          return updated;
        }

        await this.appContext.repositories.memberships.save(updated.data, { transaction });
        this.appContext.logger.info("Organization member role changed.", {
          requestId: executionContext.requestId,
          organizationId: input.organizationId,
          userId: input.userId,
          role: input.role,
        });

        return ok(updated.data);
      }),
    );
  }
}
