import type { Customer, OrganizationId } from "../../domain/index.ts";
import type { RepositoryOperationOptions } from "./options.ts";

export type CustomerRepositoryPort = Readonly<{
  save(customer: Customer, options?: RepositoryOperationOptions): Promise<void>;
  findById(customerId: string, options?: RepositoryOperationOptions): Promise<Customer | null>;
  findByEmail(email: string, options?: RepositoryOperationOptions): Promise<Customer | null>;
  findByEmailOrganization(
    email: string,
    organizationId: OrganizationId,
    options?: RepositoryOperationOptions,
  ): Promise<Customer | null>;
  listByOrganizationId(
    organizationId: OrganizationId,
    options?: RepositoryOperationOptions,
  ): Promise<readonly Customer[]>;
}>;
