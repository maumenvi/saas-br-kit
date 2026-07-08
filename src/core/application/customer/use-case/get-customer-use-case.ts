import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { Customer } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { applicationFailureFactory, useCaseRunner } from "../../shared/index.ts";
import type { CustomerAppContext } from "../context/customer-app-context.ts";
import { ensureCustomerAccess } from "../ensure-customer-access.ts";
import type { CustomerByIdInput } from "../input/customer-by-id-input.ts";

/** Reads one organization customer. */
export class GetCustomerUseCase {
  private readonly appContext: CustomerAppContext;

  constructor(appContext: CustomerAppContext) {
    this.appContext = appContext;
  }

  /** Returns a customer after validating tenant read access. */
  async execute(
    executionContext: ExecutionContext,
    input: CustomerByIdInput,
  ): Promise<Result<Customer, CoreError>> {
    const access = ensureCustomerAccess(executionContext, input.organizationId, "customers:read");
    if (!access.ok) return access;
    return useCaseRunner.runSafely(async () => {
      const customer = await this.appContext.repositories.customers.findById(input.customerId);
      return customer === null || customer.organizationId !== input.organizationId
        ? applicationFailureFactory.notFound("customer.not_found", "Customer was not found.")
        : ok(customer);
    });
  }
}
