import type {
  FindMembershipByOrganizationAndUserInput,
  Membership,
  MembershipRepositoryPort,
  RepositoryOperationOptions,
} from "#core";
import { prismaMembershipMapper } from "../mappers/index.ts";
import type { PrismaRepositoryContext } from "./context.ts";

/** Persists actor access to organizations through Prisma. */
export class PrismaMembershipRepository implements MembershipRepositoryPort {
  private readonly context: PrismaRepositoryContext;

  constructor(context: PrismaRepositoryContext) {
    this.context = context;
  }

  async save(membership: Membership, options?: RepositoryOperationOptions): Promise<void> {
    const data = prismaMembershipMapper.toPersistence(membership);
    await this.context.getClient(options).membership.upsert({
      where: { id: membership.id },
      create: data,
      update: data,
    });
  }

  async findById(
    membershipId: string,
    options?: RepositoryOperationOptions,
  ): Promise<Membership | null> {
    const row = await this.context
      .getClient(options)
      .membership.findUnique({ where: { id: membershipId } });
    return row === null ? null : prismaMembershipMapper.toDomain(row);
  }

  async findByOrganizationIdAndUserId(
    input: FindMembershipByOrganizationAndUserInput,
    options?: RepositoryOperationOptions,
  ): Promise<Membership | null> {
    const row = await this.context.getClient(options).membership.findFirst({
      where: { organizationId: input.organizationId, userId: input.userId },
    });
    return row === null ? null : prismaMembershipMapper.toDomain(row);
  }

  async listByUserId(
    userId: string,
    options?: RepositoryOperationOptions,
  ): Promise<readonly Membership[]> {
    const rows = await this.context.getClient(options).membership.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => prismaMembershipMapper.toDomain(row));
  }

  async listByOrganizationId(
    organizationId: string,
    options?: RepositoryOperationOptions,
  ): Promise<readonly Membership[]> {
    const rows = await this.context.getClient(options).membership.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => prismaMembershipMapper.toDomain(row));
  }
}
