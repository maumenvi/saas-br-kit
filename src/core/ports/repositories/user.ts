import type { User, UserId } from "../../domain/index.ts";
import type { RepositoryOperationOptions } from "./options.ts";

export type UserRepositoryPort = Readonly<{
  save(user: User, options?: RepositoryOperationOptions): Promise<void>;
  findById(userId: UserId, options?: RepositoryOperationOptions): Promise<User | null>;
  findByEmail(email: string, options?: RepositoryOperationOptions): Promise<User | null>;
  list(options?: RepositoryOperationOptions): Promise<readonly User[]>;
}>;
