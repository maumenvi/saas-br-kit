import type {
  FederatedIdentity,
  FederatedIdentityRepositoryPort,
  RepositoryOperationOptions,
} from "#core";
import { prismaFederatedIdentityMapper } from "../mappers/index.ts";
import type { PrismaRepositoryContext } from "./context.ts";

/** Persists stable issuer/subject links for local users. */
export class PrismaFederatedIdentityRepository implements FederatedIdentityRepositoryPort {
  private readonly context: PrismaRepositoryContext;

  constructor(context: PrismaRepositoryContext) {
    this.context = context;
  }

  /** Upserts one local federated identity record. */
  async save(identity: FederatedIdentity, options?: RepositoryOperationOptions): Promise<void> {
    const data = prismaFederatedIdentityMapper.toPersistence(identity);
    await this.context.getClient(options).federatedIdentity.upsert({
      where: { id: identity.id },
      create: data,
      update: data,
    });
  }

  /** Finds an identity by the stable OIDC issuer and subject pair. */
  async findByIssuerAndSubject(
    input: Readonly<{ issuer: string; subject: string }>,
    options?: RepositoryOperationOptions,
  ): Promise<FederatedIdentity | null> {
    const row = await this.context.getClient(options).federatedIdentity.findUnique({
      where: {
        issuer_subject: {
          issuer: input.issuer,
          subject: input.subject,
        },
      },
    });
    return row === null ? null : prismaFederatedIdentityMapper.toDomain(row);
  }

  /** Finds the identity a user linked for one issuer. */
  async findByUserIdAndIssuer(
    input: Readonly<{ userId: string; issuer: string }>,
    options?: RepositoryOperationOptions,
  ): Promise<FederatedIdentity | null> {
    const row = await this.context.getClient(options).federatedIdentity.findUnique({
      where: {
        userId_issuer: {
          userId: input.userId,
          issuer: input.issuer,
        },
      },
    });
    return row === null ? null : prismaFederatedIdentityMapper.toDomain(row);
  }
}
