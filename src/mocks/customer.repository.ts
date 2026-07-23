import type { RepositoriesExtra } from '../core/context/app.context.ts';
import type { CustomerRepositoryPort } from '../core/entities/customer/customer.repositories.ts';
import type { Customer } from '../core/entities/customer/customer.ts';
import type { Status } from './status.ts';

export class CustomerRepositoryMock implements CustomerRepositoryPort<
  Status,
  RepositoriesExtra['customers']
> {
  readonly customers: Customer<Status>[] = [];
  async save(entity: Customer<Status>): Promise<void> { this.customers.push(entity); }
  async update(entity: Customer<Status>): Promise<void> { this.replace(entity); }
  async changeStatus(entity: Customer<Status>): Promise<void> { this.replace(entity); }
  async findById(id: string): Promise<Customer<Status> | null> {
    return this.customers.find(item => item.id === id) ?? null;
  }
  async findByName(organizationId: string, name: string): Promise<Customer<Status>[]> {
    return this.by(organizationId, item => item.name === name);
  }
  async findByEmail(organizationId: string, email: string): Promise<Customer<Status>[]> {
    return this.by(organizationId, item => item.email === email);
  }
  async findByTelephone(organizationId: string, telephone: string): Promise<Customer<Status>[]> {
    return this.by(organizationId, item => item.telephone === telephone);
  }
  async findByOrganizationId(organizationId: string): Promise<Customer<Status>[]> {
    return this.by(organizationId, () => true);
  }
  private by(
    organizationId: string,
    predicate: (customer: Customer<Status>) => boolean,
  ): Customer<Status>[] {
    return this.customers.filter(item =>
      item.organizationId === organizationId && predicate(item)
    );
  }
  private replace(entity: Customer<Status>): void {
    const index = this.customers.findIndex(item => item.id === entity.id);
    if (index >= 0) this.customers[index] = entity;
  }
}
