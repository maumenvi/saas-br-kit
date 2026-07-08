import type { ExecutionContext } from "../../../context/execution-context.ts";
import { FederatedIdentity, User } from "../../../domain/index.ts";
import type { CoreError, Result } from "../../../errors/result.ts";
import type { TransactionScope } from "../../../ports/index.ts";
import { applicationFailureFactory, useCaseRunner } from "../../shared/index.ts";
import { FederatedSessionService } from "../service/federated-session.ts";
import { ActiveUserLoader } from "../service/users.ts";
import type { AuthResult, FederatedAuthAppContext, FederatedLoginInput } from "../types.ts";

/** Resolves a verified external identity and emits an internal SaaS BR session. */
export class LoginWithFederatedIdentityUseCase {
  private readonly appContext: FederatedAuthAppContext;

  constructor(appContext: FederatedAuthAppContext) {
    this.appContext = appContext;
  }

  /** Logs in an existing link or creates a new local user from a verified email. */
  async execute(
    executionContext: ExecutionContext,
    input: FederatedLoginInput,
  ): Promise<Result<AuthResult, CoreError>> {
    return useCaseRunner.runSafely(async () =>
      this.appContext.transactionManager.runInTransaction(async (transaction) => {
        const current = await this.appContext.auth.federatedIdentities.findByIssuerAndSubject(
          { issuer: input.issuer, subject: input.subject },
          { transaction },
        );
        const user =
          current === null
            ? await this.createLocalIdentity(input, transaction)
            : await new ActiveUserLoader(this.appContext).load(current.userId);
        if (!user.ok) {
          return user;
        }
        return new FederatedSessionService(this.appContext).issue(executionContext, {
          user: user.data,
          ...(input.deviceId === undefined ? {} : { deviceId: input.deviceId }),
          ...(input.organizationUrl === undefined
            ? {}
            : { organizationUrl: input.organizationUrl }),
        });
      }),
    );
  }

  private async createLocalIdentity(
    input: FederatedLoginInput,
    transaction: TransactionScope,
  ): Promise<Result<User, CoreError>> {
    if (input.email === undefined || input.emailVerified !== true) {
      return applicationFailureFactory.authorization(
        "federated_identity.verified_email_required",
        "A verified provider email is required to create a local user.",
      );
    }
    const existingUser = await this.appContext.auth.users.findByEmail(input.email, {
      transaction,
    });
    if (existingUser !== null) {
      return applicationFailureFactory.conflict(
        "federated_identity.link_required",
        "An existing local account must explicitly link this external identity.",
      );
    }
    const now = this.appContext.clock.now().toISOString();
    const user = User.create({
      id: this.appContext.idGenerator.newId(),
      email: input.email,
      createdAt: now,
      ...(input.displayName === undefined ? {} : { displayName: input.displayName }),
    });
    if (!user.ok) {
      return user;
    }
    const identity = FederatedIdentity.create({
      id: this.appContext.idGenerator.newId(),
      userId: user.data.id,
      providerId: input.providerId,
      issuer: input.issuer,
      subject: input.subject,
      email: input.email,
      createdAt: now,
    });
    if (!identity.ok) {
      return identity;
    }
    await this.appContext.auth.users.save(user.data, { transaction });
    await this.appContext.auth.federatedIdentities.save(identity.data, { transaction });
    return user;
  }
}
