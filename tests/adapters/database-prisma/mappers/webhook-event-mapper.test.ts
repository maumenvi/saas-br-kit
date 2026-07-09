import assert from "node:assert/strict";
import test from "node:test";
import { prismaWebhookEventMapper } from "../../../../src/adapters/database-prisma/mappers/webhook-event-mapper.ts";
import { laterTimestamp, makeWebhookEvent, timestamp } from "../support.ts";

test("maps webhook events to persistence and back", () => {
  const event = makeWebhookEvent();
  const persisted = prismaWebhookEventMapper.toPersistence(event);

  assert.deepEqual(persisted, {
    id: "webhook_1",
    provider: "asaas",
    providerEventId: "event_1",
    eventName: "PAYMENT_RECEIVED",
    status: "processed",
    rawPayload: { payment: "payment_1", nested: { accepted: true } },
    receivedAt: new Date(timestamp),
    updatedAt: new Date(laterTimestamp),
    processingAttempts: 2,
    organizationId: "org_1",
    providerConnectionId: "connection_1",
    providerAccountId: "account_1",
    processedAt: new Date(laterTimestamp),
    failedAt: undefined,
    unknownAt: undefined,
    lastErrorCode: "previous_error",
    analysisReason: "replayed",
    metadata: { source: "test" },
  });
  assert.deepEqual(prismaWebhookEventMapper.toDomain(persisted), event);
});

test("preserves absent optional webhook event fields", () => {
  const restored = prismaWebhookEventMapper.toDomain({
    id: "webhook_1",
    provider: "asaas",
    providerEventId: "event_1",
    eventName: "PAYMENT_RECEIVED",
    status: "pending",
    rawPayload: "{}",
    receivedAt: timestamp,
    updatedAt: timestamp,
    processingAttempts: 0,
    processedAt: null,
    failedAt: undefined,
    unknownAt: null,
  });

  assert.equal(restored.organizationId, undefined);
  assert.equal(restored.processedAt, undefined);
  assert.equal(restored.failedAt, undefined);
  assert.equal(restored.unknownAt, undefined);
  assert.equal(restored.metadata, undefined);
  assert.deepEqual(prismaWebhookEventMapper.toPersistence(restored), {
    id: "webhook_1",
    provider: "asaas",
    providerEventId: "event_1",
    eventName: "PAYMENT_RECEIVED",
    status: "pending",
    rawPayload: "{}",
    receivedAt: new Date(timestamp),
    updatedAt: new Date(timestamp),
    processingAttempts: 0,
    organizationId: undefined,
    providerConnectionId: undefined,
    providerAccountId: undefined,
    processedAt: undefined,
    failedAt: undefined,
    unknownAt: undefined,
    lastErrorCode: undefined,
    analysisReason: undefined,
    metadata: undefined,
  });

  const failed = prismaWebhookEventMapper.toDomain({
    ...prismaWebhookEventMapper.toPersistence(makeWebhookEvent()),
    status: "failed",
    processedAt: null,
    failedAt: laterTimestamp,
    unknownAt: laterTimestamp,
  });
  const failedPersistence = prismaWebhookEventMapper.toPersistence(failed);
  assert.deepEqual(failedPersistence.failedAt, new Date(laterTimestamp));
  assert.deepEqual(failedPersistence.unknownAt, new Date(laterTimestamp));

  assert.throws(
    () =>
      prismaWebhookEventMapper.toDomain({
        ...prismaWebhookEventMapper.toPersistence(makeWebhookEvent()),
        id: "",
      }),
    /webhookEvent\.id/,
  );
});
