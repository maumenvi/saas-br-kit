import type { RepositoryOperationOptions } from "../repositories/options.ts";

export type PasswordResetTokenRecord = Readonly<{
  id: string;
  userId: string;
  secretHash: string;
  expiresAt: string;
  createdAt: string;
  consumedAt?: string;
}>;

export type PasswordResetTokenStorePort = Readonly<{
  save(record: PasswordResetTokenRecord, options?: RepositoryOperationOptions): Promise<void>;
  findBySecretHash(
    secretHash: string,
    options?: RepositoryOperationOptions,
  ): Promise<PasswordResetTokenRecord | null>;
}>;
