import { ExecutionContext } from "#core";

export type NestRequestLike = Readonly<{
  headers?: Readonly<Record<string, string | readonly string[] | undefined>>;
  user?: Readonly<{
    userId: string;
    organizationId?: string;
    permissions: readonly string[];
  }>;
}>;

/** Creates Core execution contexts from lightweight Nest request metadata. */
export class NestExecutionContextFactory {
  /**
   * Builds a request-scoped Core context from guard-authenticated identity and trusted fallbacks.
   */
  create(
    request: NestRequestLike | undefined,
    fallback: Readonly<{
      organizationId?: string;
      actorId?: string;
      permissions?: readonly string[];
    }> = {},
  ): ExecutionContext {
    const requestId = this.header(request, "x-request-id") ?? crypto.randomUUID();
    const authenticatedUser = request?.user;
    const actorId = authenticatedUser === undefined ? fallback.actorId : authenticatedUser.userId;
    const organizationId =
      authenticatedUser === undefined ? fallback.organizationId : authenticatedUser.organizationId;
    const permissions =
      authenticatedUser === undefined ? fallback.permissions : authenticatedUser.permissions;

    return ExecutionContext.create({
      requestId,
      actor: actorId === undefined ? { type: "system" } : { type: "user", id: actorId },
      ...(organizationId === undefined ? {} : { organizationId }),
      ...(permissions === undefined ? {} : { permissions }),
    });
  }

  private header(request: NestRequestLike | undefined, name: string): string | undefined {
    const expected = name.toLowerCase();
    for (const [key, value] of Object.entries(request?.headers ?? {})) {
      if (key.toLowerCase() !== expected) {
        continue;
      }
      if (typeof value === "string") {
        return value;
      }
      return value?.[0];
    }
    return undefined;
  }
}

export const nestExecutionContextFactory = new NestExecutionContextFactory();
