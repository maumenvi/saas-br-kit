import type { ExecutionContext } from "../../context/execution-context.ts";
import type { Result } from "../../errors/result.ts";
import { applicationFailureFactory } from "./errors.ts";

/**
 * Evaluates common actor, tenant and permission policies for application classes.
 */
export class ExecutionPolicy {
  /**
   * Allows system actors or the same user to perform a user-scoped operation.
   */
  ensureActorCanRepresentUser(
    executionContext: ExecutionContext,
    userId: string,
  ): Result<undefined> {
    if (executionContext.actor.type === "system") {
      return { ok: true, data: undefined };
    }

    if (executionContext.actor.type !== "user" || executionContext.actor.id !== userId) {
      return applicationFailureFactory.authorization(
        "core.actor_user_mismatch",
        "Execution actor cannot represent the requested user.",
      );
    }

    return { ok: true, data: undefined };
  }

  /**
   * Ensures a tenant-scoped operation is bound to the requested organization.
   */
  ensureTenantScope(executionContext: ExecutionContext, organizationId: string): Result<undefined> {
    if (executionContext.actor.type === "system") {
      return { ok: true, data: undefined };
    }

    if (executionContext.organizationId === undefined) {
      return applicationFailureFactory.authorization(
        "core.organization_context_required",
        "Execution context must include organizationId for tenant-scoped billing operations.",
      );
    }

    if (executionContext.organizationId !== organizationId) {
      return applicationFailureFactory.authorization(
        "core.organization_scope_mismatch",
        "Execution context organizationId does not match the requested organization.",
      );
    }

    return { ok: true, data: undefined };
  }

  /**
   * Verifies that the operation context carries a required permission.
   */
  ensurePermission(executionContext: ExecutionContext, permission: string): Result<undefined> {
    if (executionContext.actor.type === "system") {
      return { ok: true, data: undefined };
    }

    if (
      !executionContext.permissions.includes(permission) &&
      !executionContext.permissions.includes("*")
    ) {
      return applicationFailureFactory.authorization(
        "core.permission_denied",
        "Execution context does not include the required permission.",
        { permission },
      );
    }

    return { ok: true, data: undefined };
  }
}

/** Shared execution policy used by application classes. */
export const executionPolicy = new ExecutionPolicy();

/** Compatibility facade for user representation checks. */
export const ensureActorCanRepresentUser = (
  executionContext: ExecutionContext,
  userId: string,
): Result<undefined> => executionPolicy.ensureActorCanRepresentUser(executionContext, userId);

/** Compatibility facade for tenant-scope checks. */
export const ensureTenantScope = (
  executionContext: ExecutionContext,
  organizationId: string,
): Result<undefined> => executionPolicy.ensureTenantScope(executionContext, organizationId);

/** Compatibility facade for permission checks. */
export const ensurePermission = (
  executionContext: ExecutionContext,
  permission: string,
): Result<undefined> => executionPolicy.ensurePermission(executionContext, permission);
