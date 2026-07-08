import type { Membership } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { applicationFailureFactory, executionPolicy } from "../../shared/index.ts";
import type { ActorMembershipInput } from "../types.ts";
import { MembershipOrganizationService } from "./organizations.ts";

/**
 * Resolves actor memberships and enforces membership permissions.
 */
export class MembershipPermissionService {
  /**
   * Returns the membership represented by the execution actor.
   */
  async getActorMembership(input: ActorMembershipInput): Promise<Result<Membership, CoreError>> {
    const organizationService = new MembershipOrganizationService(input.appContext);

    if (input.executionContext.actor.type === "system") {
      return organizationService.createOwnerMembership(
        input.organization,
        input.appContext.clock.now().toISOString(),
      );
    }

    if (input.executionContext.actor.type !== "user") {
      return applicationFailureFactory.authorization(
        "membership.user_actor_required",
        "Membership operations require a user actor.",
      );
    }

    if (input.organization.ownerUserId === input.executionContext.actor.id) {
      return organizationService.createOwnerMembership(
        input.organization,
        input.appContext.clock.now().toISOString(),
      );
    }

    const membership =
      await input.appContext.repositories.memberships.findByOrganizationIdAndUserId({
        organizationId: input.organization.id,
        userId: input.executionContext.actor.id,
      });

    if (
      membership === null ||
      !membership.allowsPermission(input.permission, input.organization.roleConfig)
    ) {
      return applicationFailureFactory.authorization(
        "membership.permission_denied",
        "Actor does not have the required organization membership permission.",
        {
          organizationId: input.organization.id,
          permission: input.permission,
        },
      );
    }

    return ok(membership);
  }

  /**
   * Ensures that the actor belongs to the tenant and has the required permission.
   */
  async ensureActorMembershipPermission(
    input: ActorMembershipInput,
  ): Promise<Result<undefined, CoreError>> {
    const scope = executionPolicy.ensureTenantScope(input.executionContext, input.organization.id);
    if (!scope.ok) {
      return scope;
    }

    const membership = await this.getActorMembership(input);
    if (!membership.ok) {
      return membership;
    }

    if (!membership.data.allowsPermission(input.permission, input.organization.roleConfig)) {
      return applicationFailureFactory.authorization(
        "membership.permission_denied",
        "Actor does not have the required organization membership permission.",
        {
          organizationId: input.organization.id,
          permission: input.permission,
        },
      );
    }

    return ok(undefined);
  }
}
