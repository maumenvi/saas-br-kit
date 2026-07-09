import type {
  RepositoryOperationOptions,
  User,
  UserCredentials,
  UserCredentialsRepositoryPort,
  UserRepositoryPort,
} from "#core";
import { prismaUserCredentialsMapper, prismaUserMapper } from "../mappers/index.ts";
import type { PrismaRepositoryContext } from "./context.ts";

/** Persists system actors through Prisma. */
export class PrismaUserRepository implements UserRepositoryPort {
  private readonly context: PrismaRepositoryContext;

  constructor(context: PrismaRepositoryContext) {
    this.context = context;
  }

  async save(user: User, options?: RepositoryOperationOptions): Promise<void> {
    const data = prismaUserMapper.toPersistence(user);
    await this.context.getClient(options).user.upsert({
      where: { id: user.id },
      create: data,
      update: data,
    });
  }

  async findById(userId: string, options?: RepositoryOperationOptions): Promise<User | null> {
    const row = await this.context.getClient(options).user.findUnique({ where: { id: userId } });
    return row === null ? null : prismaUserMapper.toDomain(row);
  }

  async findByEmail(email: string, options?: RepositoryOperationOptions): Promise<User | null> {
    const row = await this.context.getClient(options).user.findUnique({ where: { email } });
    return row === null ? null : prismaUserMapper.toDomain(row);
  }

  async list(options?: RepositoryOperationOptions): Promise<readonly User[]> {
    const rows = await this.context.getClient(options).user.findMany({
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => prismaUserMapper.toDomain(row));
  }
}

/** Persists actor password credential hashes through Prisma. */
export class PrismaUserCredentialsRepository implements UserCredentialsRepositoryPort {
  private readonly context: PrismaRepositoryContext;

  constructor(context: PrismaRepositoryContext) {
    this.context = context;
  }

  async save(credentials: UserCredentials, options?: RepositoryOperationOptions): Promise<void> {
    const data = prismaUserCredentialsMapper.toPersistence(credentials);
    await this.context.getClient(options).userCredentials.upsert({
      where: { userId: credentials.userId },
      create: data,
      update: data,
    });
  }

  async findByEmail(
    email: string,
    options?: RepositoryOperationOptions,
  ): Promise<UserCredentials | null> {
    const row = await this.context
      .getClient(options)
      .userCredentials.findUnique({ where: { email } });
    return row === null ? null : prismaUserCredentialsMapper.toDomain(row);
  }
}
