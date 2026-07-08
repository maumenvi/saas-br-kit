import { ok, type Result } from "../../errors/result.ts";
import type { EntityId, OrganizationId } from "../index.ts";
import type { SafeMetadata } from "../metadata/index.ts";
import { freezeSafeMetadata } from "../metadata/index.ts";
import {
  ensureAllowedString,
  normalizeOptionalText,
  normalizeRequiredText,
  normalizeTimestamp,
} from "../validation/index.ts";
import type { AuditEventActorType, AuditEventType } from "./event-types.ts";
import { AUDIT_EVENT_TYPES } from "./event-types.ts";
import type { AuditEventProps, CreateAuditEventEntityInput } from "./types.ts";

/**
 * Records an auditable business or security event.
 */
export class AuditEvent {
  /** Audit event identifier used by repositories. */
  public readonly id: EntityId;

  /** Normalized audit event type. */
  public readonly type: AuditEventType;

  /** ISO timestamp for when the audited event occurred. */
  public readonly occurredAt: string;

  /** Optional request correlation identifier. */
  public readonly requestId?: string;

  /** Optional actor type responsible for the event. */
  public readonly actorType?: AuditEventActorType;

  /** Optional actor identifier responsible for the event. */
  public readonly actorId?: string;

  /** Optional tenant related to the event. */
  public readonly organizationId?: OrganizationId;

  /** Optional audited entity type. */
  public readonly entityType?: string;

  /** Optional audited entity identifier. */
  public readonly entityId?: string;

  /** Optional safe metadata for audit context. */
  public readonly metadata?: SafeMetadata;

  /** Stores normalized audit event properties immutably. */
  private constructor(props: AuditEventProps) {
    this.id = props.id;
    this.type = props.type;
    this.occurredAt = props.occurredAt;
    if (props.requestId !== undefined) {
      this.requestId = props.requestId;
    }
    if (props.actorType !== undefined) {
      this.actorType = props.actorType;
    }
    if (props.actorId !== undefined) {
      this.actorId = props.actorId;
    }
    if (props.organizationId !== undefined) {
      this.organizationId = props.organizationId;
    }
    if (props.entityType !== undefined) {
      this.entityType = props.entityType;
    }
    if (props.entityId !== undefined) {
      this.entityId = props.entityId;
    }
    if (props.metadata !== undefined) {
      this.metadata = props.metadata;
    }
    Object.freeze(this);
  }

  /**
   * Creates an audit event after validating type, timestamp and optional fields.
   */
  static create(input: CreateAuditEventEntityInput): Result<AuditEvent> {
    const id = normalizeRequiredText("auditEvent.id", input.id, { maxLength: 120 });
    if (!id.ok) {
      return id;
    }

    const type = ensureAllowedString("auditEvent.type", input.type, AUDIT_EVENT_TYPES);
    if (!type.ok) {
      return type;
    }

    const occurredAt = normalizeTimestamp("auditEvent.occurredAt", input.occurredAt);
    if (!occurredAt.ok) {
      return occurredAt;
    }

    const requestId = normalizeOptionalText("auditEvent.requestId", input.requestId, {
      maxLength: 120,
    });
    if (!requestId.ok) {
      return requestId;
    }

    const actorId = normalizeOptionalText("auditEvent.actorId", input.actorId, {
      maxLength: 120,
    });
    if (!actorId.ok) {
      return actorId;
    }

    const entityType = normalizeOptionalText("auditEvent.entityType", input.entityType, {
      maxLength: 80,
    });
    if (!entityType.ok) {
      return entityType;
    }

    const entityId = normalizeOptionalText("auditEvent.entityId", input.entityId, {
      maxLength: 120,
    });
    if (!entityId.ok) {
      return entityId;
    }

    const metadata = freezeSafeMetadata(input.metadata);

    return ok(
      new AuditEvent({
        id: id.data,
        type: type.data,
        occurredAt: occurredAt.data,
        ...(requestId.data === undefined ? {} : { requestId: requestId.data }),
        ...(input.actorType === undefined ? {} : { actorType: input.actorType }),
        ...(actorId.data === undefined ? {} : { actorId: actorId.data }),
        ...(input.organizationId === undefined ? {} : { organizationId: input.organizationId }),
        ...(entityType.data === undefined ? {} : { entityType: entityType.data }),
        ...(entityId.data === undefined ? {} : { entityId: entityId.data }),
        ...(metadata === undefined ? {} : { metadata }),
      }),
    );
  }
}
