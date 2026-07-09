import { GenericDatabaseAdapter } from "#adapters/database";
import type { PrismaDatabaseClient, PrismaTransactionClient } from "./prisma-types.ts";

export type PrismaDatabaseAdapter = GenericDatabaseAdapter<
  PrismaDatabaseClient,
  PrismaTransactionClient
>;

/** Creates the official external Postgres/Prisma database adapter. */
export function prismaDatabaseAdapter(client: PrismaDatabaseClient): PrismaDatabaseAdapter {
  return new GenericDatabaseAdapter<PrismaDatabaseClient, PrismaTransactionClient>({
    name: "postgres-prisma",
    client,
    transaction: {
      run: (client, operation) => client.$transaction(operation),
    },
    healthCheck: async (client) => {
      if (client.$queryRaw !== undefined) {
        await client.$queryRaw`SELECT 1`;
      }
      return { status: "up" };
    },
    dispose: async (client) => {
      await client.$disconnect?.();
    },
  });
}
