import type { UserCredentials } from "../../domain/index.ts";
import type { RepositoryOperationOptions } from "../repositories/options.ts";

export type UserCredentialsRepositoryPort = Readonly<{
  save(credentials: UserCredentials, options?: RepositoryOperationOptions): Promise<void>;
  findByEmail(email: string, options?: RepositoryOperationOptions): Promise<UserCredentials | null>;
}>;
