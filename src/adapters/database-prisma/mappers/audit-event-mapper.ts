import { AuditEvent, type AuditEventActorType, type AuditEventType } from "#core";
import { asRow, jsonValue, optionalString, safeMetadata, toIsoString } from "./helpers.ts";

/** Maps AuditEvent entities to and from Prisma rows. */
export class PrismaAuditEventMapper {
  /** Converts a domain audit event into Prisma persistence data. */
  toPersistence(event: AuditEvent): Record<string, unknown> {
    return {
      id: event.id,
      type: event.type,
      occurredAt: new Date(event.occurredAt),
      requestId: event.requestId,
      actorType: event.actorType,
      actorId: event.actorId,
      organizationId: event.organizationId,
      entityType: event.entityType,
      entityId: event.entityId,
      metadata: event.metadata === undefined ? undefined : jsonValue(event.metadata),
    };
  }

  /** Rehydrates a domain audit event from a Prisma row. */
  toDomain(row: unknown): AuditEvent {
    const data = asRow(row);
    const requestId = optionalString(data.requestId);
    const actorType = optionalString(data.actorType);
    const actorId = optionalString(data.actorId);
    const organizationId = optionalString(data.organizationId);
    const entityType = optionalString(data.entityType);
    const entityId = optionalString(data.entityId);
    const metadata = safeMetadata(data.metadata);
    const result = AuditEvent.create({
      id: String(data.id),
      type: String(data.type) as AuditEventType,
      occurredAt: toIsoString(data.occurredAt),
      ...(requestId === undefined ? {} : { requestId }),
      ...(actorType === undefined ? {} : { actorType: actorType as AuditEventActorType }),
      ...(actorId === undefined ? {} : { actorId }),
      ...(organizationId === undefined ? {} : { organizationId }),
      ...(entityType === undefined ? {} : { entityType }),
      ...(entityId === undefined ? {} : { entityId }),
      ...(metadata === undefined ? {} : { metadata }),
    });

    if (!result.ok) {
      throw new Error(result.error.message);
    }

    return result.data;
  }
}

export const prismaAuditEventMapper = new PrismaAuditEventMapper();
