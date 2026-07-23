import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { CustomerRepositoryPort } from '../customer.repositories.ts';
import type { CustomerInput } from './customer.input.ts';
import { validateCustomerDocument } from '../domain/customer.document.ts';

export class CreateCustomerUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly customerRepository: CustomerRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    customerRepository: CustomerRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.customerRepository = customerRepository;
  }

  async execute(customer: CustomerInput<Status, Extra>): Promise<void> {
    validateCustomerDocument(customer);
    await this.executionContext.databaseProvider.run(async () => {
      await this.customerRepository.save(customer);
    });
  }
}
