import type { ExecutionContext } from '../../../context/execution.context.ts';
import { CustomerErrors } from '../domain/customer.errors.ts';
import { anonymizeValue } from '../domain/customer.document.ts';
import type { CustomerRepositoryPort } from '../customer.repositories.ts';

export type AnonymizeCustomerInput = Readonly<{
  customerId: string;
  organizationId: string;
}>;

export class AnonymizeCustomerUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly customerRepository: CustomerRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    customerRepository: CustomerRepositoryPort<Status, Extra>,
  ) {
    this.executionContext = executionContext;
    this.customerRepository = customerRepository;
  }

  async execute(input: AnonymizeCustomerInput): Promise<void> {
    await this.executionContext.databaseProvider.run(async () => {
      const customer = await this.customerRepository.findById(input.customerId);
      if (!customer) throw CustomerErrors.notFound(input.customerId);
      if (customer.organizationId !== input.organizationId) {
        throw CustomerErrors.crossOrganizationReference(input.customerId);
      }
      await this.customerRepository.update(Object.freeze({
        ...customer,
        email: anonymizeValue(customer.email),
        telephone: anonymizeValue(customer.telephone),
        ...(customer.document
          ? { document: anonymizeValue(customer.document) }
          : {}),
      }));
    });
  }
}
