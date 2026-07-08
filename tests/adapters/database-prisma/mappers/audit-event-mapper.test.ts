import assert from "node:assert/strict";
import test from "node:test";
import { prismaAuditEventMapper } from "../../../../src/adapters/database-prisma/mappers/audit-event-mapper.ts";
import { makeAuditEvent, timestamp } from "../support.ts";

test("maps audit events to persistence and back", () => {
  const event = makeAuditEvent();
  const persisted = prismaAuditEventMapper.toPersistence(event);

  assert.deepEqual(persisted, {
    id: "audit_event_1",
    type: "billing.subscription_created",
    occurredAt: new Date(timestamp),
    requestId: "request_1",
    actorType: "service",
    actorId: "service_1",
    organizationId: "org_1",
    entityType: "subscription",
    entityId: "sub_1",
    metadata: { source: "test" },
  });
  assert.deepEqual(prismaAuditEventMapper.toDomain(persisted), event);
});

test("excludes invalid optional audit event values", () => {
  const restored = prismaAuditEventMapper.toDomain({
    id: "audit_event_1",
    type: "billing.plan_created",
    occurredAt: timestamp,
    requestId: null,
    actorType: 1,
    actorId: false,
    organizationId: {},
    entityType: [],
    entityId: null,
    metadata: [],
  });

  assert.equal(restored.requestId, undefined);
  assert.equal(restored.actorType, undefined);
  assert.equal(restored.actorId, undefined);
  assert.equal(restored.organizationId, undefined);
  assert.equal(restored.entityType, undefined);
  assert.equal(restored.entityId, undefined);
  assert.equal(prismaAuditEventMapper.toPersistence(restored).metadata, undefined);
  assert.throws(
    () =>
      prismaAuditEventMapper.toDomain({
        ...prismaAuditEventMapper.toPersistence(makeAuditEvent()),
        id: "",
      }),
    /auditEvent\.id/,
  );
});
