import type { ExecutionContext } from "../../context/execution-context.ts";
import type { CoreError, Result } from "../../errors/result.ts";
import { executionPolicy } from "../shared/index.ts";

export const ensureCustomerAccess = (
  executionContext: ExecutionContext,
  organizationId: string,
  permission: "customers:read" | "customers:write",
): Result<undefined, CoreError> => {
  const tenant = executionPolicy.ensureTenantScope(executionContext, organizationId);
  return tenant.ok ? executionPolicy.ensurePermission(executionContext, permission) : tenant;
};
