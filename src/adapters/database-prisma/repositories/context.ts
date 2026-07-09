import type { DatabaseAdapter } from "#adapters/database";
import type { RepositoryOperationOptions } from "#core";
import type { PrismaDatabaseClient, PrismaTransactionClient } from "../prisma-types.ts";

export type PrismaClientLike = PrismaDatabaseClient | PrismaTransactionClient;

/** Resolves the root Prisma client or a transaction-scoped client for repositories. */
export class PrismaRepositoryContext {
  private readonly database: DatabaseAdapter<PrismaDatabaseClient, PrismaTransactionClient>;

  /** Stores the database adapter used to resolve transaction scopes. */
  constructor(database: DatabaseAdapter<PrismaDatabaseClient, PrismaTransactionClient>) {
    this.database = database;
  }

  /** Returns a Prisma client honoring repository operation options. */
  getClient(options?: RepositoryOperationOptions): PrismaClientLike {
    return this.database.getClient(options?.transaction);
  }
}
