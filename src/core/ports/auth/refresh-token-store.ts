import type { RefreshTokenSession } from "../../domain/index.ts";
import type { RepositoryOperationOptions } from "../repositories/options.ts";

export type RevokeRefreshTokenFamilyInput = Readonly<{
  familyId: string;
  revokedAt: string;
  reason: string;
}>;

export type RefreshTokenStorePort = Readonly<{
  hashSecret(secret: string): Promise<string>;
  save(session: RefreshTokenSession, options?: RepositoryOperationOptions): Promise<void>;
  findBySecretHash(
    secretHash: string,
    options?: RepositoryOperationOptions,
  ): Promise<RefreshTokenSession | null>;
  revokeFamily(
    input: RevokeRefreshTokenFamilyInput,
    options?: RepositoryOperationOptions,
  ): Promise<void>;
}>;
