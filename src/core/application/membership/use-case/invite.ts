import type { ExecutionContext } from "../../../context/execution-context.ts";
import { Membership } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import {
  applicationFailureFactory,
  sendOptionalEmailNotification,
  useCaseRunner,
} from "../../shared/index.ts";
import { MembershipOrganizationService } from "../service/organizations.ts";
import { MembershipPermissionService } from "../service/permissions.ts";
import type { InviteOrganizationMemberInput, MembershipAppContext } from "../types.ts";

/**
 * Invites a user to join an organization with a non-owner role.
 */
export class InviteOrganizationMemberUseCase {
  private readonly appContext: MembershipAppContext;

  /** Stores repositories and shared ports used by the invitation flow. */
  constructor(appContext: MembershipAppContext) {
    this.appContext = appContext;
  }

  /**
   * Executes the invitation flow after checking actor membership permissions.
   */
  async execute(
    executionContext: ExecutionContext,
    input: InviteOrganizationMemberInput,
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
          permission: "organization:members:invite",
        });
        if (!permission.ok) {
          return permission;
        }

        if (input.role === organization.data.roleConfig.ownerRoleName) {
          return applicationFailureFactory.authorization(
            "membership.owner_invitation_forbidden",
            "The owner role cannot be assigned through an employee invitation.",
          );
        }
        if (!organization.data.roleConfig.employeeRoles.some((role) => role.name === input.role)) {
          return applicationFailureFactory.notFound(
            "membership.role_not_found",
            "Employee role is not configured for this organization.",
          );
        }

        const existing =
          await this.appContext.repositories.memberships.findByOrganizationIdAndUserId(
            {
              organizationId: input.organizationId,
              userId: input.userId,
            },
            { transaction },
          );
        if (existing !== null && existing.status !== "disabled") {
          return applicationFailureFactory.conflict(
            "membership.already_exists",
            "User already has an active or pending membership in this organization.",
            {
              organizationId: input.organizationId,
              userId: input.userId,
            },
          );
        }

        const now = this.appContext.clock.now().toISOString();
        const invitedByUserId =
          executionContext.actor.type === "user" ? executionContext.actor.id : undefined;
        const membership = Membership.create({
          id: this.appContext.idGenerator.newId(),
          organizationId: input.organizationId,
          userId: input.userId,
          role: input.role,
          status: "invited",
          createdAt: now,
          ...(invitedByUserId === undefined ? {} : { invitedByUserId }),
        });
        if (!membership.ok) {
          return membership;
        }

        await this.appContext.repositories.memberships.save(membership.data, { transaction });
        this.appContext.logger.info("Organization member invited.", {
          requestId: executionContext.requestId,
          organizationId: input.organizationId,
          userId: input.userId,
          role: input.role,
        });

        const invitedUser = await this.appContext.auth?.users?.findById?.(input.userId, {
          transaction,
        });
        if (invitedUser === null || invitedUser === undefined) {
          this.appContext.logger.error("Invited user email could not be resolved.", {
            requestId: executionContext.requestId,
            organizationId: input.organizationId,
            userId: input.userId,
          });
          return ok(membership.data);
        }

        await sendOptionalEmailNotification(this.appContext, "sendUserInvitationEmail", {
          to: invitedUser.email,
          organizationId: organization.data.id,
          organizationName: organization.data.name,
          role: membership.data.role,
          invitedUserId: invitedUser.id,
          ...(membership.data.invitedByUserId === undefined
            ? {}
            : { invitedByUserId: membership.data.invitedByUserId }),
        });

        return ok(membership.data);
      }),
    );
  }
}
