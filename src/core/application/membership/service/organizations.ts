import { Membership, type Organization, type OrganizationId } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { applicationFailureFactory } from "../../shared/index.ts";
import type { MembershipAppContext } from "../types.ts";

/**
 * Provides organization lookups and synthetic owner memberships for membership flows.
 */
export class MembershipOrganizationService {
  private readonly appContext: MembershipAppContext;

  /** Stores repositories used by membership use cases. */
  constructor(appContext: MembershipAppContext) {
    this.appContext = appContext;
  }

  /**
   * Loads an organization or returns the normalized not-found failure.
   */
  async findOrganization(organizationId: OrganizationId): Promise<Result<Organization, CoreError>> {
    const organization = await this.appContext.repositories.organizations.findById(organizationId);

    if (organization === null) {
      return applicationFailureFactory.notFound(
        "organization.not_found",
        "Organization was not found.",
        {
          organizationId,
        },
      );
    }

    return ok(organization);
  }

  /**
   * Creates an in-memory owner membership for organizations owned by the user.
   */
  createOwnerMembership(organization: Organization, now: string): Result<Membership, CoreError> {
    return Membership.create({
      id: `owner:${organization.id}:${organization.ownerUserId}`,
      organizationId: organization.id,
      userId: organization.ownerUserId,
      role: organization.roleConfig.ownerRoleName,
      status: "active",
      createdAt: organization.createdAt,
      updatedAt: now,
    });
  }
}
