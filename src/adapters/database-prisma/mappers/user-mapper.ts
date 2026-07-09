import { User, type UserCredentialStatus, UserCredentials, type UserStatus } from "#core";
import { asRow, optionalString, toIsoString } from "./helpers.ts";

/** Maps actor entities to and from Prisma records. */
export class PrismaUserMapper {
  toPersistence(user: User): Record<string, unknown> {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    };
  }

  toDomain(row: unknown): User {
    const data = asRow(row);
    const displayName = optionalString(data.displayName);
    const result = User.create({
      id: String(data.id),
      email: String(data.email),
      status: String(data.status) as UserStatus,
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
      ...(displayName === undefined ? {} : { displayName }),
    });
    if (!result.ok) {
      throw new Error(result.error.message);
    }
    return result.data;
  }
}

/** Maps actor password credentials without exposing plaintext passwords. */
export class PrismaUserCredentialsMapper {
  toPersistence(credentials: UserCredentials): Record<string, unknown> {
    return {
      userId: credentials.userId,
      email: credentials.email,
      passwordHash: credentials.passwordHash,
      status: credentials.status,
      createdAt: new Date(credentials.createdAt),
      updatedAt: new Date(credentials.updatedAt),
    };
  }

  toDomain(row: unknown): UserCredentials {
    const data = asRow(row);
    const result = UserCredentials.create({
      userId: String(data.userId),
      email: String(data.email),
      passwordHash: String(data.passwordHash),
      status: String(data.status) as UserCredentialStatus,
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
    });
    if (!result.ok) {
      throw new Error(result.error.message);
    }
    return result.data;
  }
}

export const prismaUserMapper = new PrismaUserMapper();
export const prismaUserCredentialsMapper = new PrismaUserCredentialsMapper();
