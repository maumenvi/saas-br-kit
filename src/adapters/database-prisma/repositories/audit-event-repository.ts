import type { AuditEvent, AuditEventRepositoryPort, RepositoryOperationOptions } from "#core";
import { prismaAuditEventMapper } from "../mappers/index.ts";
import type { PrismaRepositoryContext } from "./context.ts";

/** Persists audit events through Prisma. */
export class PrismaAuditEventRepository implements AuditEventRepositoryPort {
  private readonly context: PrismaRepositoryContext;

  /** Stores the repository context used to resolve transactions. */
  constructor(context: PrismaRepositoryContext) {
    this.context = context;
  }

  /** Saves an audit event. */
  async save(event: AuditEvent, options?: RepositoryOperationOptions): Promise<void> {
    await this.context.getClient(options).auditEvent.create({
      data: prismaAuditEventMapper.toPersistence(event),
    });
  }
}
