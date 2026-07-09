import type { Organization, OrganizationRepositoryPort, RepositoryOperationOptions } from "#core";
import { prismaOrganizationMapper } from "../mappers/index.ts";
import type { PrismaRepositoryContext } from "./context.ts";

/** Persists organizations through Prisma while implementing the Core repository port. */
export class PrismaOrganizationRepository implements OrganizationRepositoryPort {
  private readonly context: PrismaRepositoryContext;

  /** Stores the repository context used to resolve transactions. */
  constructor(context: PrismaRepositoryContext) {
    this.context = context;
  }

  /** Saves an organization by id using an upsert. */
  async save(organization: Organization, options?: RepositoryOperationOptions): Promise<void> {
    const data = prismaOrganizationMapper.toPersistence(organization);
    await this.context.getClient(options).organization.upsert({
      where: { id: organization.id },
      create: data,
      update: data,
    });
  }

  /** Finds an organization by id. */
  async findById(
    organizationId: string,
    options?: RepositoryOperationOptions,
  ): Promise<Organization | null> {
    const row = await this.context.getClient(options).organization.findUnique({
      where: { id: organizationId },
    });
    return row === null ? null : prismaOrganizationMapper.toDomain(row);
  }

  /** Lists organizations owned by a user. */
  async listByOwnerUserId(
    ownerUserId: string,
    options?: RepositoryOperationOptions,
  ): Promise<readonly Organization[]> {
    const rows = await this.context.getClient(options).organization.findMany({
      where: { ownerUserId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => prismaOrganizationMapper.toDomain(row));
  }
}
