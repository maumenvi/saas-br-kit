import { BillingEvent, type BillingEventType } from "#core";
import { asRow, jsonValue, optionalString, safeMetadata, toIsoString } from "./helpers.ts";

/** Maps BillingEvent entities to and from Prisma rows. */
export class PrismaBillingEventMapper {
  /** Converts a domain billing event into Prisma persistence data. */
  toPersistence(event: BillingEvent): Record<string, unknown> {
    return {
      id: event.id,
      type: event.type,
      occurredAt: new Date(event.occurredAt),
      organizationId: event.organizationId,
      planId: event.planId,
      subscriptionId: event.subscriptionId,
      metadata: event.metadata === undefined ? undefined : jsonValue(event.metadata),
    };
  }

  /** Rehydrates a domain billing event from a Prisma row. */
  toDomain(row: unknown): BillingEvent {
    const data = asRow(row);
    const organizationId = optionalString(data.organizationId);
    const planId = optionalString(data.planId);
    const subscriptionId = optionalString(data.subscriptionId);
    const metadata = safeMetadata(data.metadata);
    const result = BillingEvent.create({
      id: String(data.id),
      type: String(data.type) as BillingEventType,
      occurredAt: toIsoString(data.occurredAt),
      ...(organizationId === undefined ? {} : { organizationId }),
      ...(planId === undefined ? {} : { planId }),
      ...(subscriptionId === undefined ? {} : { subscriptionId }),
      ...(metadata === undefined ? {} : { metadata }),
    });

    if (!result.ok) {
      throw new Error(result.error.message);
    }

    return result.data;
  }
}

export const prismaBillingEventMapper = new PrismaBillingEventMapper();
