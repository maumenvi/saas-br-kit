import type { EntityId, OrganizationId } from "../index.ts";
import type { SafeMetadata } from "../metadata/index.ts";
import type { TimestampInput } from "../validation/index.ts";
import type { AuditEventActorType, AuditEventType } from "./event-types.ts";

export type AuditEventProps = Readonly<{
  id: EntityId;
  type: AuditEventType;
  occurredAt: string;
  requestId?: string;
  actorType?: AuditEventActorType;
  actorId?: string;
  organizationId?: OrganizationId;
  entityType?: string;
  entityId?: string;
  metadata?: SafeMetadata;
}>;

export type CreateAuditEventEntityInput = Readonly<{
  id: EntityId;
  type: AuditEventType;
  occurredAt: TimestampInput;
  requestId?: string;
  actorType?: AuditEventActorType;
  actorId?: string;
  organizationId?: OrganizationId;
  entityType?: string;
  entityId?: string;
  metadata?: SafeMetadata;
}>;
