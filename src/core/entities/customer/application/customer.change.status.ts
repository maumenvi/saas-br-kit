import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { CustomerRepositoryPort } from '../customer.repositories.ts';
import type { Customer } from '../customer.ts';

export class ChangeCustomerStatusUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly customerRepository: CustomerRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    customerRepository: CustomerRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.customerRepository = customerRepository;
  }

  async changeStatus(customer: Customer<Status, Extra>): Promise<void> {
    await this.executionContext.databaseProvider.run(async () => {
      await this.customerRepository.changeStatus(customer);
    });
  }
}
