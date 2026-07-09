import type { ExecutionContext } from "../../../context/execution-context.ts";
import { Customer } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { applicationFailureFactory, useCaseRunner } from "../../shared/index.ts";
import type { CustomerAppContext } from "../context/customer-app-context.ts";
import { ensureCustomerAccess } from "../ensure-customer-access.ts";
import type { CreateCustomerInput } from "../input/create-customer-input.ts";

/** Creates an organization customer. */
export class CreateCustomerUseCase {
  private readonly appContext: CustomerAppContext;

  constructor(appContext: CustomerAppContext) {
    this.appContext = appContext;
  }

  /** Persists a customer after validating tenant write access. */
  async execute(
    executionContext: ExecutionContext,
    input: CreateCustomerInput,
  ): Promise<Result<Customer, CoreError>> {
    const access = ensureCustomerAccess(executionContext, input.organizationId, "customers:write");
    if (!access.ok) return access;
    return useCaseRunner.runSafely(async () =>
      this.appContext.transactionManager.runInTransaction(async (transaction) => {
        if (input.email !== undefined) {
          const existingByEmail = await this.appContext.repositories.customers.findByEmail(
            input.email,
            {
              transaction,
            },
          );
          if (existingByEmail !== null && existingByEmail.organizationId === input.organizationId) {
            return applicationFailureFactory.conflict(
              "customer.email_conflict",
              "Customer email is already in use for this organization.",
              {
                organizationId: input.organizationId,
                customerId: existingByEmail.id,
              },
            );
          }
        }

        const customer = Customer.create({
          id: this.appContext.idGenerator.newId(),
          organizationId: input.organizationId,
          name: input.name,
          createdAt: this.appContext.clock.now(),
          ...(input.email === undefined ? {} : { email: input.email }),
          ...(input.document === undefined ? {} : { document: input.document }),
          ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
        });
        if (!customer.ok) return customer;
        await this.appContext.repositories.customers.save(customer.data, { transaction });
        return ok(customer.data);
      }),
    );
  }
}
