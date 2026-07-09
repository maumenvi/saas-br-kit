import type { ExecutionContext } from "../../../context/execution-context.ts";
import { Organization, User, UserCredentials } from "../../../domain/index.ts";
import { CoreFunctionalityNotConfiguredError } from "../../../errors/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import type { RepositoryOperationOptions } from "../../../ports/repositories/options.ts";
import {
  applicationFailureFactory,
  sendOptionalEmailNotification,
  useCaseRunner,
} from "../../shared/index.ts";
import type { CreateAccountAppContext } from "../context/create-account-app-context.ts";
import { AuthSessionService } from "../service/sessions.ts";
import type { CreateAccountInput, CreateAccountResult } from "../types.ts";

/**
 * Orchestrates self-service account creation with actor, credentials, organization and login tokens.
 */
export class CreateAccountUseCase {
  private readonly appContext: CreateAccountAppContext;

  constructor(appContext: CreateAccountAppContext) {
    this.appContext = appContext;
  }

  async execute(
    executionContext: ExecutionContext,
    input: CreateAccountInput,
  ): Promise<Result<CreateAccountResult, CoreError>> {
    const sessionService = new AuthSessionService(this.appContext);

    return useCaseRunner.runSafely(async () =>
      this.appContext.transactionManager.runInTransaction(async (transaction) => {
        if (
          (await this.findUserByEmail(input.email, { transaction })) !== null ||
          (await this.findCredentialsByEmail(input.email, {
            transaction,
          })) !== null
        ) {
          return applicationFailureFactory.conflict(
            "account.email_conflict",
            "An account with this email already exists.",
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

        const passwordHash = await this.appContext.auth.passwordHasher.hashPassword(input.password);
        const credentials = UserCredentials.create({
          userId: user.data.id,
          email: user.data.email,
          passwordHash,
          createdAt: now,
        });
        if (!credentials.ok) {
          return credentials;
        }

        const organization = Organization.create({
          id: this.appContext.idGenerator.newId(),
          ownerUserId: user.data.id,
          name: input.organizationName,
          createdAt: now,
          ...(input.organizationSubdomain === undefined
            ? {}
            : { subdomain: input.organizationSubdomain }),
          ...(input.organizationUrl === undefined ? {} : { url: input.organizationUrl }),
        });
        if (!organization.ok) {
          return organization;
        }

        await this.insertUser(user.data, { transaction });
        await this.insertCredentials(credentials.data, { transaction });
        await this.insertOrganization(organization.data, { transaction });

        const authResult = await sessionService.issueAuthResult({
          user: user.data,
          issuedAt: now,
          ...(input.deviceId === undefined ? {} : { deviceId: input.deviceId }),
          memberships: [
            {
              organizationId: organization.data.id,
              role: organization.data.roleConfig.ownerRoleName,
              status: "active",
            },
          ],
        });
        if (!authResult.ok) {
          return authResult;
        }

        this.appContext.logger.info("Account created.", {
          requestId: executionContext.requestId,
          userId: user.data.id,
          organizationId: organization.data.id,
          refreshTokenSessionId: authResult.data.refreshTokenSessionId,
        });

        await sendOptionalEmailNotification(this.appContext, "sendAccountCreatedEmail", {
          to: user.data.email,
          userId: user.data.id,
          ...(user.data.displayName === undefined ? {} : { displayName: user.data.displayName }),
          organizationId: organization.data.id,
          organizationName: organization.data.name,
          ...(organization.data.subdomain === undefined
            ? {}
            : { organizationSubdomain: organization.data.subdomain }),
          ...(organization.data.url === undefined
            ? {}
            : { organizationUrl: organization.data.url }),
        });

        return ok(
          Object.freeze({
            ...authResult.data,
            organization: organization.data,
            organizations: Object.freeze([
              {
                organizationId: organization.data.id,
                name: organization.data.name,
                role: organization.data.roleConfig.ownerRoleName,
                permissions: Object.freeze(["*"]),
                ...(organization.data.subdomain === undefined
                  ? {}
                  : { subdomain: organization.data.subdomain }),
                ...(organization.data.url === undefined ? {} : { url: organization.data.url }),
              },
            ]),
          }),
        );
      }),
    );
  }

  private async findUserByEmail(email: string, options?: RepositoryOperationOptions) {
    const capability = this.appContext.auth.capabilities?.users?.findUserByEmail;
    if (capability !== undefined) {
      return capability(email, options);
    }
    if (this.appContext.auth.users !== undefined) {
      return this.appContext.auth.users.findByEmail(email, options);
    }
    throw new CoreFunctionalityNotConfiguredError("auth.capabilities.users.findUserByEmail");
  }

  private async findCredentialsByEmail(email: string, options?: RepositoryOperationOptions) {
    const capability = this.appContext.auth.capabilities?.userCredentials?.findCredentialsByEmail;
    if (capability !== undefined) {
      return capability(email, options);
    }
    if (this.appContext.auth.userCredentials !== undefined) {
      return this.appContext.auth.userCredentials.findByEmail(email, options);
    }
    throw new CoreFunctionalityNotConfiguredError(
      "auth.capabilities.userCredentials.findCredentialsByEmail",
    );
  }

  private async insertUser(user: User, options?: RepositoryOperationOptions): Promise<void> {
    const capability = this.appContext.auth.capabilities?.users?.insertUser;
    if (capability !== undefined) {
      await capability(user, options);
      return;
    }
    if (this.appContext.auth.users !== undefined) {
      await this.appContext.auth.users.save(user, options);
      return;
    }
    throw new CoreFunctionalityNotConfiguredError("auth.capabilities.users.insertUser");
  }

  private async insertCredentials(
    credentials: UserCredentials,
    options?: RepositoryOperationOptions,
  ): Promise<void> {
    const capability = this.appContext.auth.capabilities?.userCredentials?.insertCredentials;
    if (capability !== undefined) {
      await capability(credentials, options);
      return;
    }
    if (this.appContext.auth.userCredentials !== undefined) {
      await this.appContext.auth.userCredentials.save(credentials, options);
      return;
    }
    throw new CoreFunctionalityNotConfiguredError("auth.capabilities.userCredentials.insertCredentials");
  }

  private async insertOrganization(
    organization: Organization,
    options?: RepositoryOperationOptions,
  ): Promise<void> {
    const capability = this.appContext.capabilities?.organizations?.insertOrganization;
    if (capability !== undefined) {
      await capability(organization, options);
      return;
    }
    const repository = this.appContext.repositories?.organizations;
    if (repository !== undefined) {
      await repository.save(organization, options);
      return;
    }
    throw new CoreFunctionalityNotConfiguredError("capabilities.organizations.insertOrganization");
  }
}
