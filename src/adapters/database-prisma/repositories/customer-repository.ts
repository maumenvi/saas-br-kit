import type { Customer, CustomerRepositoryPort, RepositoryOperationOptions } from "#core";
import { prismaCustomerMapper } from "../mappers/index.ts";
import type { PrismaRepositoryContext } from "./context.ts";

/** Persists organization-scoped customers through Prisma. */
export class PrismaCustomerRepository implements CustomerRepositoryPort {
  private readonly context: PrismaRepositoryContext;

  constructor(context: PrismaRepositoryContext) {
    this.context = context;
  }

  async findByEmail(email: string, options?: RepositoryOperationOptions): Promise<Customer | null> {
    const row = await this.context.getClient(options).customer.findFirst({ where: { email } });
    return row === null ? null : prismaCustomerMapper.toDomain(row);
  }

  async findByEmailOrganization(
    email: string,
    organizationId: string,
    options?: RepositoryOperationOptions,
  ): Promise<Customer | null> {
    const row = await this.context
      .getClient(options)
      .customer.findFirst({ where: { email, organizationId } });
    return row === null ? null : prismaCustomerMapper.toDomain(row);
  }

  async save(customer: Customer, options?: RepositoryOperationOptions): Promise<void> {
    const data = prismaCustomerMapper.toPersistence(customer);
    await this.context.getClient(options).customer.upsert({
      where: { id: customer.id },
      create: data,
      update: data,
    });
  }

  async findById(
    customerId: string,
    options?: RepositoryOperationOptions,
  ): Promise<Customer | null> {
    const row = await this.context
      .getClient(options)
      .customer.findUnique({ where: { id: customerId } });
    return row === null ? null : prismaCustomerMapper.toDomain(row);
  }

  async listByOrganizationId(
    organizationId: string,
    options?: RepositoryOperationOptions,
  ): Promise<readonly Customer[]> {
    const rows = await this.context.getClient(options).customer.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => prismaCustomerMapper.toDomain(row));
  }
}
