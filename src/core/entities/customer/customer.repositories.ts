import type { RepositoryPort } from '../../ports/repositories.port.ts';
import type { Customer } from './customer.ts';

export interface CustomerRepositoryPort<Status, Extra = unknown>
  extends RepositoryPort<Customer<Status, Extra>> {
  findByName(organizationId: string, name: string): Promise<Customer<Status, Extra>[]>;
  findByEmail(organizationId: string, email: string): Promise<Customer<Status, Extra>[]>;
  findByTelephone(organizationId: string, telephone: string): Promise<Customer<Status, Extra>[]>;
  findByOrganizationId(organizationId: string): Promise<Customer<Status, Extra>[]>;
}
