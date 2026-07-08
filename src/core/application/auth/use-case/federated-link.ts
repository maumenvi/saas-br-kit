import type { ExecutionContext } from "../../../context/execution-context.ts";
import { FederatedIdentity } from "../../../domain/index.ts";
import type { CoreError, Result } from "../../../errors/result.ts";
import { applicationFailureFactory, useCaseRunner } from "../../shared/index.ts";
import type { FederatedAuthAppContext, LinkFederatedIdentityInput } from "../types.ts";

/** Links a verified external identity to the currently authenticated local user. */
export class LinkFederatedIdentityUseCase {
  private readonly appContext: FederatedAuthAppContext;

  constructor(appContext: FederatedAuthAppContext) {
    this.appContext = appContext;
  }

  /** Persists an explicit account link without trusting email as the identity key. */
  async execute(
    executionContext: ExecutionContext,
    input: LinkFederatedIdentityInput,
  ): Promise<Result<FederatedIdentity, CoreError>> {
    if (executionContext.actor.type !== "user") {
      return applicationFailureFactory.authorization(
        "federated_identity.user_actor_required",
        "Linking an external identity requires an authenticated user.",
      );
    }
    const userId = executionContext.actor.id;
    return useCaseRunner.runSafely(async () =>
      this.appContext.transactionManager.runInTransaction(async (transaction) => {
        const user = await this.appContext.auth.users.findById(userId, { transaction });
        if (user === null || user.status !== "active") {
          return applicationFailureFactory.notFound("actor.not_found", "Actor was not found.");
        }
        const existing = await this.appContext.auth.federatedIdentities.findByIssuerAndSubject(
          { issuer: input.issuer, subject: input.subject },
          { transaction },
        );
        if (existing !== null) {
          return existing.userId === userId
            ? { ok: true, data: existing }
            : applicationFailureFactory.conflict(
                "federated_identity.already_linked",
                "External identity is already linked to another user.",
              );
        }
        const issuerLink = await this.appContext.auth.federatedIdentities.findByUserIdAndIssuer(
          { userId, issuer: input.issuer },
          { transaction },
        );
        if (issuerLink !== null) {
          return applicationFailureFactory.conflict(
            "federated_identity.issuer_already_linked",
            "User already has an identity linked for this issuer.",
          );
        }
        const identity = FederatedIdentity.create({
          id: this.appContext.idGenerator.newId(),
          userId,
          providerId: input.providerId,
          issuer: input.issuer,
          subject: input.subject,
          createdAt: this.appContext.clock.now().toISOString(),
          ...(input.emailVerified === true && input.email !== undefined
            ? { email: input.email }
            : {}),
        });
        if (!identity.ok) {
          return identity;
        }
        await this.appContext.auth.federatedIdentities.save(identity.data, { transaction });
        this.appContext.logger.info("Federated identity linked.", {
          requestId: executionContext.requestId,
          userId,
          providerId: input.providerId,
          issuer: input.issuer,
        });
        return identity;
      }),
    );
  }
}
