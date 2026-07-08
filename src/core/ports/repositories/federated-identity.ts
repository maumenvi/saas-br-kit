import type { FederatedIdentity } from "../../domain/index.ts";
import type { RepositoryOperationOptions } from "./options.ts";

export type FederatedIdentityRepositoryPort = Readonly<{
  save(identity: FederatedIdentity, options?: RepositoryOperationOptions): Promise<void>;
  findByIssuerAndSubject(
    input: Readonly<{ issuer: string; subject: string }>,
    options?: RepositoryOperationOptions,
  ): Promise<FederatedIdentity | null>;
  findByUserIdAndIssuer(
    input: Readonly<{ userId: string; issuer: string }>,
    options?: RepositoryOperationOptions,
  ): Promise<FederatedIdentity | null>;
}>;
