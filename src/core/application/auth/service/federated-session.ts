import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { User } from "../../../domain/index.ts";
import type { CoreError, Result } from "../../../errors/result.ts";
import { ok } from "../../../errors/result.ts";
import type { AuthAppContext, AuthResult } from "../types.ts";
import { AuthenticatedOrganizationAccessService } from "./organization-access.ts";
import { AuthSessionService } from "./sessions.ts";

/** Issues internal SaaS BR sessions after an external identity has been resolved locally. */
export class FederatedSessionService {
  private readonly appContext: AuthAppContext;

  constructor(appContext: AuthAppContext) {
    this.appContext = appContext;
  }

  /** Creates access and refresh tokens with trusted local membership claims. */
  async issue(
    executionContext: ExecutionContext,
    input: Readonly<{
      user: User;
      deviceId?: string;
      organizationUrl?: string | null;
    }>,
  ): Promise<Result<AuthResult, CoreError>> {
    const organizationAccess = await new AuthenticatedOrganizationAccessService(
      this.appContext,
    ).resolve(input.user.id, input.organizationUrl);
    if (!organizationAccess.ok) {
      return organizationAccess;
    }
    const memberships = organizationAccess.data?.map((access) =>
      Object.freeze({
        organizationId: access.organizationId,
        role: access.role,
        status: "active",
      }),
    );
    const result = await new AuthSessionService(this.appContext).issueAuthResult({
      user: input.user,
      issuedAt: this.appContext.clock.now().toISOString(),
      ...(input.deviceId === undefined ? {} : { deviceId: input.deviceId }),
      ...(memberships === undefined ? {} : { memberships }),
    });
    if (!result.ok) {
      return result;
    }
    this.appContext.logger.info("Federated user authenticated.", {
      requestId: executionContext.requestId,
      userId: input.user.id,
      refreshTokenSessionId: result.data.refreshTokenSessionId,
    });
    return organizationAccess.data === undefined
      ? result
      : ok(Object.freeze({ ...result.data, organizations: organizationAccess.data }));
  }
}
