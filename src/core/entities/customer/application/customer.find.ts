import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { CustomerRepositoryPort } from '../customer.repositories.ts';
import type { Customer } from '../customer.ts';

export class FindCustomerByIdUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly customerRepository: CustomerRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    customerRepository: CustomerRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.customerRepository = customerRepository;
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<Customer<Status, Extra> | null> {
    return await this.executionContext.databaseProvider.run(async () => {
      const customer = await this.customerRepository.findById(id);
      return customer?.organizationId === organizationId ? customer : null;
    });
  }

  async findByName(organizationId: string, name: string): Promise<Customer<Status, Extra>[]> {
    return await this.executionContext.databaseProvider.run(
      async () => await this.customerRepository.findByName(organizationId, name),
    );
  }

  async findByEmail(organizationId: string, email: string): Promise<Customer<Status, Extra>[]> {
    return await this.executionContext.databaseProvider.run(
      async () => await this.customerRepository.findByEmail(organizationId, email),
    );
  }

  async findByTelephone(
    organizationId: string,
    telephone: string,
  ): Promise<Customer<Status, Extra>[]> {
    return await this.executionContext.databaseProvider.run(
      async () => await this.customerRepository.findByTelephone(organizationId, telephone),
    );
  }

  async findByOrganizationId(organizationId: string): Promise<Customer<Status, Extra>[]> {
    return await this.executionContext.databaseProvider.run(
      async () => await this.customerRepository.findByOrganizationId(organizationId),
    );
  }
}
