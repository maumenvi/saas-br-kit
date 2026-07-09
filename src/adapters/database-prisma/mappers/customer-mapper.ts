import { Customer, type CustomerStatus } from "#core";
import { asRow, jsonValue, optionalString, safeMetadata, toIsoString } from "./helpers.ts";

/** Maps organization customers to and from Prisma records. */
export class PrismaCustomerMapper {
  toPersistence(customer: Customer): Record<string, unknown> {
    return {
      id: customer.id,
      organizationId: customer.organizationId,
      name: customer.name,
      email: customer.email,
      document: customer.document,
      status: customer.status,
      metadata: customer.metadata === undefined ? undefined : jsonValue(customer.metadata),
      createdAt: new Date(customer.createdAt),
      updatedAt: new Date(customer.updatedAt),
    };
  }

  toDomain(row: unknown): Customer {
    const data = asRow(row);
    const email = optionalString(data.email);
    const document = optionalString(data.document);
    const metadata = safeMetadata(data.metadata);
    const result = Customer.create({
      id: String(data.id),
      organizationId: String(data.organizationId),
      name: String(data.name),
      status: String(data.status) as CustomerStatus,
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
      ...(email === undefined ? {} : { email }),
      ...(document === undefined ? {} : { document }),
      ...(metadata === undefined ? {} : { metadata }),
    });
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }
}

export const prismaCustomerMapper = new PrismaCustomerMapper();
