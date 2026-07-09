import type { Plan, PlanRepositoryPort, RepositoryOperationOptions } from "#core";
import { prismaPlanMapper } from "../mappers/index.ts";
import type { PrismaRepositoryContext } from "./context.ts";

/** Persists plans through Prisma while implementing the Core repository port. */
export class PrismaPlanRepository implements PlanRepositoryPort {
  private readonly context: PrismaRepositoryContext;

  /** Stores the repository context used to resolve transactions. */
  constructor(context: PrismaRepositoryContext) {
    this.context = context;
  }

  /** Saves a plan by id using an upsert. */
  async save(plan: Plan, options?: RepositoryOperationOptions): Promise<void> {
    const data = prismaPlanMapper.toPersistence(plan);
    await this.context.getClient(options).plan.upsert({
      where: { id: plan.id },
      create: data,
      update: data,
    });
  }

  /** Finds a plan by id inside one organization. */
  async findById(
    organizationId: string,
    planId: string,
    options?: RepositoryOperationOptions,
  ): Promise<Plan | null> {
    const row = await this.context.getClient(options).plan.findFirst({
      where: { id: planId, organizationId },
    });
    return row === null ? null : prismaPlanMapper.toDomain(row);
  }

  /** Finds a plan by organization-scoped public code. */
  async findByCode(
    organizationId: string,
    code: string,
    options?: RepositoryOperationOptions,
  ): Promise<Plan | null> {
    const row = await this.context.getClient(options).plan.findUnique({
      where: { organizationId_code: { organizationId, code } },
    });
    return row === null ? null : prismaPlanMapper.toDomain(row);
  }

  /** Lists one organization's plans in stable creation order. */
  async listByOrganizationId(
    organizationId: string,
    options?: RepositoryOperationOptions,
  ): Promise<readonly Plan[]> {
    const rows = await this.context.getClient(options).plan.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => prismaPlanMapper.toDomain(row));
  }
}
