import type { RepositoryOperationOptions } from "#core";
import type { PrismaRepositoryContext } from "./context.ts";

type PasswordResetTokenRecord = Readonly<{
  id: string;
  userId: string;
  secretHash: string;
  expiresAt: string;
  createdAt: string;
  consumedAt?: string;
}>;

type PasswordResetTokenStorePort = Readonly<{
  save(record: PasswordResetTokenRecord, options?: RepositoryOperationOptions): Promise<void>;
  findBySecretHash(
    secretHash: string,
    options?: RepositoryOperationOptions,
  ): Promise<PasswordResetTokenRecord | null>;
}>;

export class PrismaPasswordResetTokenRepository implements PasswordResetTokenStorePort {
  private readonly context: PrismaRepositoryContext;

  constructor(context: PrismaRepositoryContext) {
    this.context = context;
  }

  async save(
    record: PasswordResetTokenRecord,
    options?: RepositoryOperationOptions,
  ): Promise<void> {
    await this.context.getClient(options).passwordResetToken.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        userId: record.userId,
        secretHash: record.secretHash,
        expiresAt: new Date(record.expiresAt),
        createdAt: new Date(record.createdAt),
        consumedAt: record.consumedAt === undefined ? null : new Date(record.consumedAt),
      },
      update: {
        userId: record.userId,
        secretHash: record.secretHash,
        expiresAt: new Date(record.expiresAt),
        createdAt: new Date(record.createdAt),
        consumedAt: record.consumedAt === undefined ? null : new Date(record.consumedAt),
      },
    });
  }

  async findBySecretHash(
    secretHash: string,
    options?: RepositoryOperationOptions,
  ): Promise<PasswordResetTokenRecord | null> {
    const row = await this.context.getClient(options).passwordResetToken.findUnique({
      where: { secretHash },
    });
    if (row === null) {
      return null;
    }
    const data = row as {
      id: string;
      userId: string;
      secretHash: string;
      expiresAt: Date;
      createdAt: Date;
      consumedAt: Date | null;
    };
    return Object.freeze({
      id: data.id,
      userId: data.userId,
      secretHash: data.secretHash,
      expiresAt: data.expiresAt.toISOString(),
      createdAt: data.createdAt.toISOString(),
      ...(data.consumedAt === null ? {} : { consumedAt: data.consumedAt.toISOString() }),
    });
  }
}
