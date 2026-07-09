import type { ExecutionContext } from "../../../context/execution-context.ts";
import { Customer } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { applicationFailureFactory, useCaseRunner } from "../../shared/index.ts";
import type { CustomerAppContext } from "../context/customer-app-context.ts";
import { ensureCustomerAccess } from "../ensure-customer-access.ts";
import type { UpdateCustomerInput } from "../input/update-customer-input.ts";

/** Updates mutable customer fields. */
export class UpdateCustomerUseCase {
  private readonly appContext: CustomerAppContext;

  constructor(appContext: CustomerAppContext) {
    this.appContext = appContext;
  }

  /** Persists customer changes after validating tenant write access. */
  async execute(
    executionContext: ExecutionContext,
    input: UpdateCustomerInput,
  ): Promise<Result<Customer, CoreError>> {
    const access = ensureCustomerAccess(executionContext, input.organizationId, "customers:write");
    if (!access.ok) return access;
    return useCaseRunner.runSafely(async () =>
      this.appContext.transactionManager.runInTransaction(async (transaction) => {
        const current = await this.appContext.repositories.customers.findById(input.customerId, {
          transaction,
        });
        if (current === null || current.organizationId !== input.organizationId) {
          return applicationFailureFactory.notFound(
            "customer.not_found",
            "Customer was not found.",
          );
        }
        if (input.email !== undefined && input.email !== null) {
          const existingByEmail = await this.appContext.repositories.customers.findByEmail(
            input.email,
            {
              transaction,
            },
          );
          if (
            existingByEmail !== null &&
            existingByEmail.organizationId === input.organizationId &&
            existingByEmail.id !== current.id
          ) {
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
        const email = input.email ?? current.email;
        const document = input.document ?? current.document;
        const metadata = input.metadata ?? current.metadata;
        const updated = Customer.create({
          id: current.id,
          organizationId: current.organizationId,
          name: input.name ?? current.name,
          status: current.status,
          createdAt: current.createdAt,
          updatedAt: this.appContext.clock.now(),
          ...(input.email === null || email === undefined ? {} : { email }),
          ...(input.document === null || document === undefined ? {} : { document }),
          ...(input.metadata === null || metadata === undefined ? {} : { metadata }),
        });
        if (!updated.ok) return updated;
        await this.appContext.repositories.customers.save(updated.data, { transaction });
        return ok(updated.data);
      }),
    );
  }
}
