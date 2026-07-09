import { FederatedIdentity } from "#core";
import { asRow, optionalString, toIsoString } from "./helpers.ts";

/** Maps local federated identity links to and from Prisma records. */
export class PrismaFederatedIdentityMapper {
  /** Converts a Core identity into Prisma persistence data. */
  toPersistence(identity: FederatedIdentity): Record<string, unknown> {
    return {
      id: identity.id,
      userId: identity.userId,
      providerId: identity.providerId,
      issuer: identity.issuer,
      subject: identity.subject,
      email: identity.email,
      createdAt: new Date(identity.createdAt),
      updatedAt: new Date(identity.updatedAt),
    };
  }

  /** Recreates a validated Core identity from one Prisma row. */
  toDomain(row: unknown): FederatedIdentity {
    const data = asRow(row);
    const email = optionalString(data.email);
    const result = FederatedIdentity.create({
      id: String(data.id),
      userId: String(data.userId),
      providerId: String(data.providerId),
      issuer: String(data.issuer),
      subject: String(data.subject),
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
      ...(email === undefined ? {} : { email }),
    });
    if (!result.ok) {
      throw new Error(result.error.message);
    }
    return result.data;
  }
}

export const prismaFederatedIdentityMapper = new PrismaFederatedIdentityMapper();
