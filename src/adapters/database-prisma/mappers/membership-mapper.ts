import { Membership, type MembershipStatus } from "#core";
import { asRow, optionalString, toIsoString } from "./helpers.ts";

/** Maps actor-organization memberships to and from Prisma records. */
export class PrismaMembershipMapper {
  toPersistence(membership: Membership): Record<string, unknown> {
    return {
      id: membership.id,
      organizationId: membership.organizationId,
      userId: membership.userId,
      role: membership.role,
      status: membership.status,
      invitedByUserId: membership.invitedByUserId,
      createdAt: new Date(membership.createdAt),
      updatedAt: new Date(membership.updatedAt),
    };
  }

  toDomain(row: unknown): Membership {
    const data = asRow(row);
    const invitedByUserId = optionalString(data.invitedByUserId);
    const result = Membership.create({
      id: String(data.id),
      organizationId: String(data.organizationId),
      userId: String(data.userId),
      role: String(data.role),
      status: String(data.status) as MembershipStatus,
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
      ...(invitedByUserId === undefined ? {} : { invitedByUserId }),
    });
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }
}

export const prismaMembershipMapper = new PrismaMembershipMapper();
