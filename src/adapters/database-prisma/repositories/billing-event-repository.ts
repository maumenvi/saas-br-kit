import type { BillingEvent, BillingEventRepositoryPort, RepositoryOperationOptions } from "#core";
import { prismaBillingEventMapper } from "../mappers/index.ts";
import type { PrismaRepositoryContext } from "./context.ts";

/** Persists billing events through Prisma. */
export class PrismaBillingEventRepository implements BillingEventRepositoryPort {
  private readonly context: PrismaRepositoryContext;

  /** Stores the repository context used to resolve transactions. */
  constructor(context: PrismaRepositoryContext) {
    this.context = context;
  }

  /** Saves a billing event. */
  async save(event: BillingEvent, options?: RepositoryOperationOptions): Promise<void> {
    await this.context.getClient(options).billingEvent.create({
      data: prismaBillingEventMapper.toPersistence(event),
    });
  }
}
