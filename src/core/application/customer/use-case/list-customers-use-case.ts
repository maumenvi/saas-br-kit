import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { Customer } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { useCaseRunner } from "../../shared/index.ts";
import type { CustomerAppContext } from "../context/customer-app-context.ts";
import { ensureCustomerAccess } from "../ensure-customer-access.ts";
import type { ListCustomersInput } from "../input/list-customers-input.ts";

/** Lists customers belonging to one organization. */
export class ListCustomersUseCase {
  private readonly appContext: CustomerAppContext;

  constructor(appContext: CustomerAppContext) {
    this.appContext = appContext;
  }

  /** Returns tenant customers after validating read access. */
  async execute(
    executionContext: ExecutionContext,
    input: ListCustomersInput,
  ): Promise<Result<readonly Customer[], CoreError>> {
    const access = ensureCustomerAccess(executionContext, input.organizationId, "customers:read");
    if (!access.ok) return access;
    return useCaseRunner.runSafely(async () =>
      ok(await this.appContext.repositories.customers.listByOrganizationId(input.organizationId)),
    );
  }
}
