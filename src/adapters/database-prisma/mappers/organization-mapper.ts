import { Organization } from "#core";
import { asRow, jsonValue, safeMetadata, toIsoString } from "./helpers.ts";

/** Maps Organization entities to and from Prisma rows. */
export class PrismaOrganizationMapper {
  /** Converts a domain organization into Prisma persistence data. */
  toPersistence(organization: Organization): Record<string, unknown> {
    return {
      id: organization.id,
      ownerUserId: organization.ownerUserId,
      name: organization.name,
      status: organization.status,
      ...(organization.subdomain === undefined ? {} : { subdomain: organization.subdomain }),
      ...(organization.url === undefined ? {} : { url: organization.url }),
      roleConfig: jsonValue(organization.roleConfig),
      metadata: organization.metadata === undefined ? undefined : jsonValue(organization.metadata),
      createdAt: new Date(organization.createdAt),
      updatedAt: new Date(organization.updatedAt),
    };
  }

  /** Rehydrates a domain organization from a Prisma row. */
  toDomain(row: unknown): Organization {
    const data = asRow(row);
    const metadata = safeMetadata(data.metadata);
    const roleConfig = safeMetadata(data.roleConfig);
    const subdomain = typeof data.subdomain === "string" ? data.subdomain : undefined;
    const url = typeof data.url === "string" ? data.url : undefined;
    const result = Organization.create({
      id: String(data.id),
      ownerUserId: String(data.ownerUserId),
      name: String(data.name),
      status: data.status === "disabled" ? "disabled" : "active",
      ...(subdomain === undefined ? {} : { subdomain }),
      ...(url === undefined ? {} : { url }),
      ...(roleConfig === undefined
        ? {}
        : {
            roleConfig: roleConfig as unknown as NonNullable<
              Parameters<typeof Organization.create>[0]["roleConfig"]
            >,
          }),
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
      ...(metadata === undefined ? {} : { metadata }),
    });

    if (!result.ok) {
      throw new Error(result.error.message);
    }

    return result.data;
  }
}

export const prismaOrganizationMapper = new PrismaOrganizationMapper();
