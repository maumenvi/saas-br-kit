import type { User, UserCredentials } from "../../domain/index.ts";
import type { RepositoryOperationOptions } from "../repositories/options.ts";

export type UserReadCapabilitiesPort = Readonly<{
    findUserById(userId: string, options?: RepositoryOperationOptions): Promise<User | null>;
    findUserByEmail(email: string, options?: RepositoryOperationOptions): Promise<User | null>;
    listUsers(options?: RepositoryOperationOptions): Promise<readonly User[]>;
}>;

export type UserWriteCapabilitiesPort = Readonly<{
    insertUser(user: User, options?: RepositoryOperationOptions): Promise<void>;
    updateUser(user: User, options?: RepositoryOperationOptions): Promise<void>;
}>;

export type UserCredentialsReadCapabilitiesPort = Readonly<{
    findCredentialsByEmail(
        email: string,
        options?: RepositoryOperationOptions,
    ): Promise<UserCredentials | null>;
}>;

export type UserCredentialsWriteCapabilitiesPort = Readonly<{
    insertCredentials(
        credentials: UserCredentials,
        options?: RepositoryOperationOptions,
    ): Promise<void>;
}>;
