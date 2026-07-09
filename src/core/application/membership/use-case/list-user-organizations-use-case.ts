import type { ExecutionContext } from "../../../context/execution-context.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { executionPolicy, useCaseRunner } from "../../shared/index.ts";
import { MembershipOrganizationService } from "../service/organizations.ts";
import type {
  ListUserOrganizationsInput,
  MembershipAppContext,
  UserOrganizationMembership,
} from "../types.ts";

/** Lists organizations visible to a user through ownership or membership. */
export class ListUserOrganizationsUseCase {
  private readonly appContext: MembershipAppContext;

  /** Stores membership repositories and shared ports required by the list flow. */
  constructor(appContext: MembershipAppContext) {
    this.appContext = appContext;
  }

  /** Executes the organization listing for a user represented by the actor. */
  async execute(
    executionContext: ExecutionContext,
    input: ListUserOrganizationsInput,
  ): Promise<Result<readonly UserOrganizationMembership[], CoreError>> {
    const actor = executionPolicy.ensureActorCanRepresentUser(executionContext, input.userId);
    if (!actor.ok) {
      return actor;
    }
    const organizationService = new MembershipOrganizationService(this.appContext);

    return useCaseRunner.runSafely(async () => {
      const memberships = await this.appContext.repositories.memberships.listByUserId(input.userId);
      const visibleMemberships = memberships.filter(
        (membership) => membership.status !== "disabled",
      );
      const entries = await Promise.all(
        visibleMemberships.map(async (membership) => {
          const organization = await this.appContext.repositories.organizations.findById(
            membership.organizationId,
          );

          return organization === null
            ? null
            : Object.freeze({
                organization,
                membership,
              });
        }),
      );

      const userOrganizationMemberships = entries.filter(
        (entry): entry is UserOrganizationMembership => entry !== null,
      );

      const ownerOrganizations =
        this.appContext.repositories.organizations.listByOwnerUserId === undefined
          ? []
          : await this.appContext.repositories.organizations.listByOwnerUserId(input.userId);
      const now = this.appContext.clock.now().toISOString();

      for (const organization of ownerOrganizations) {
        if (
          userOrganizationMemberships.some((entry) => entry.organization.id === organization.id)
        ) {
          continue;
        }

        const membership = organizationService.createOwnerMembership(organization, now);
        if (!membership.ok) {
          return membership;
        }

        userOrganizationMemberships.push(
          Object.freeze({
            organization,
            membership: membership.data,
          }),
        );
      }

      return ok(Object.freeze(userOrganizationMemberships));
    });
  }
}
