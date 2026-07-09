import type { ExecutionContext } from "../../../context/execution-context.ts";
import { Customer } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import type { CustomerAppContext } from "../context/customer-app-context.ts";
import { ensureCustomerAccess } from "../ensure-customer-access.ts";
import type { CustomerByIdInput } from "../input/customer-by-id-input.ts";
import { GetCustomerUseCase } from "./get-customer-use-case.ts";

/** Soft-deletes a customer by disabling it. */
export class DisableCustomerUseCase {
  private readonly appContext: CustomerAppContext;

  constructor(appContext: CustomerAppContext) {
    this.appContext = appContext;
  }

  /** Moves one customer to the disabled lifecycle state. */
  async execute(
    executionContext: ExecutionContext,
    input: CustomerByIdInput,
  ): Promise<Result<Customer, CoreError>> {
    const current = await new GetCustomerUseCase(this.appContext).execute(executionContext, input);
    if (!current.ok) return current;
    const access = ensureCustomerAccess(executionContext, input.organizationId, "customers:write");
    if (!access.ok) return access;
    const disabled = Customer.create({
      id: current.data.id,
      organizationId: current.data.organizationId,
      name: current.data.name,
      status: "disabled",
      createdAt: current.data.createdAt,
      updatedAt: this.appContext.clock.now(),
      ...(current.data.email === undefined ? {} : { email: current.data.email }),
      ...(current.data.document === undefined ? {} : { document: current.data.document }),
      ...(current.data.metadata === undefined ? {} : { metadata: current.data.metadata }),
    });
    if (!disabled.ok) return disabled;
    await this.appContext.repositories.customers.save(disabled.data);
    return ok(disabled.data);
  }
}
