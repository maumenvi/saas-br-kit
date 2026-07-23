import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { CustomerRepositoryPort } from '../customer.repositories.ts';
import type { Customer } from '../customer.ts';
import { validateCustomerDocument } from '../domain/customer.document.ts';

export class UpdateCustomerUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly customerRepository: CustomerRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    customerRepository: CustomerRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.customerRepository = customerRepository;
  }

  async update(customer: Customer<Status, Extra>): Promise<void> {
    validateCustomerDocument(customer);
    await this.executionContext.databaseProvider.run(async () => {
      await this.customerRepository.update(customer);
    });
  }
}
