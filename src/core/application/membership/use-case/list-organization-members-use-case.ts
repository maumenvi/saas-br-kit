import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { Membership } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { useCaseRunner } from "../../shared/index.ts";
import { MembershipOrganizationService } from "../service/organizations.ts";
import { MembershipPermissionService } from "../service/permissions.ts";
import type { ListOrganizationMembersInput, MembershipAppContext } from "../types.ts";

/** Lists active and invited actor memberships for one organization. */
export class ListOrganizationMembersUseCase {
  private readonly appContext: MembershipAppContext;

  constructor(appContext: MembershipAppContext) {
    this.appContext = appContext;
  }

  /** Returns organization memberships after validating read permission. */
  async execute(
    executionContext: ExecutionContext,
    input: ListOrganizationMembersInput,
  ): Promise<Result<readonly Membership[], CoreError>> {
    const organization = await new MembershipOrganizationService(this.appContext).findOrganization(
      input.organizationId,
    );
    if (!organization.ok) {
      return organization;
    }
    const permission = await new MembershipPermissionService().ensureActorMembershipPermission({
      appContext: this.appContext,
      executionContext,
      organization: organization.data,
      permission: "organization:members:read",
    });
    if (!permission.ok) {
      return permission;
    }
    return useCaseRunner.runSafely(async () =>
      ok(await this.appContext.repositories.memberships.listByOrganizationId(input.organizationId)),
    );
  }
}
