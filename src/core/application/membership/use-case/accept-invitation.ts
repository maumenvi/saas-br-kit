import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { Membership } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { applicationFailureFactory, useCaseRunner } from "../../shared/index.ts";
import type { AcceptOrganizationInvitationInput, MembershipAppContext } from "../types.ts";

/**
 * Accepts a pending organization invitation for the current user actor.
 */
export class AcceptOrganizationInvitationUseCase {
  private readonly appContext: MembershipAppContext;

  /** Stores membership repositories and shared ports required by the flow. */
  constructor(appContext: MembershipAppContext) {
    this.appContext = appContext;
  }

  /**
   * Executes invitation acceptance and persists the activated membership.
   */
  async execute(
    executionContext: ExecutionContext,
    input: AcceptOrganizationInvitationInput,
  ): Promise<Result<Membership, CoreError>> {
    if (executionContext.actor.type !== "user") {
      return applicationFailureFactory.authorization(
        "membership.user_actor_required",
        "Accepting an invitation requires a user actor.",
      );
    }
    const actorUserId = executionContext.actor.id;

    return useCaseRunner.runSafely(async () =>
      this.appContext.transactionManager.runInTransaction(async (transaction) => {
        const membership =
          await this.appContext.repositories.memberships.findByOrganizationIdAndUserId(
            {
              organizationId: input.organizationId,
              userId: actorUserId,
            },
            { transaction },
          );

        if (membership === null) {
          return applicationFailureFactory.notFound(
            "membership.invitation_not_found",
            "Membership invitation was not found.",
            { organizationId: input.organizationId },
          );
        }

        if (membership.status !== "invited") {
          return applicationFailureFactory.conflict(
            "membership.invitation_not_pending",
            "Membership invitation is not pending.",
            {
              organizationId: input.organizationId,
              status: membership.status,
            },
          );
        }

        const accepted = membership.activate({
          acceptedAt: this.appContext.clock.now().toISOString(),
        });
        if (!accepted.ok) {
          return accepted;
        }

        await this.appContext.repositories.memberships.save(accepted.data, { transaction });
        this.appContext.logger.info("Organization invitation accepted.", {
          requestId: executionContext.requestId,
          organizationId: input.organizationId,
          userId: actorUserId,
        });

        return ok(accepted.data);
      }),
    );
  }
}
