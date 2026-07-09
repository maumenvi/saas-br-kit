/// <reference types="node" />

import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

type CoreModule = typeof import("../../../src/core/index.ts");
type TestingModule = typeof import("../../../src/testing/index.ts");

const rootDir = process.cwd();

const loadCore = async (): Promise<CoreModule> =>
  import(pathToFileURL(path.join(rootDir, "src/core/index.ts")).href);
const loadTesting = async (): Promise<TestingModule> =>
  import(pathToFileURL(path.join(rootDir, "src/testing/index.ts")).href);

test("in-memory webhook event repository deduplicates provider events", async () => {
  const core = await loadCore();
  const testing = await loadTesting();
  const repository = testing.createInMemoryWebhookEventRepository();

  assert.equal(repository instanceof testing.InMemoryWebhookEventRepositoryAdapter, true);

  const event = core.createWebhookEventEntity({
    id: "wh_1",
    provider: "fixture",
    providerEventId: "evt_1",
    eventName: "subscription.updated",
    rawPayload: { id: "evt_1" },
    receivedAt: "2026-06-18T12:00:00.000Z",
  });
  const duplicate = core.createWebhookEventEntity({
    id: "wh_2",
    provider: "fixture",
    providerEventId: "evt_1",
    eventName: "subscription.updated",
    rawPayload: { id: "evt_1", retry: true },
    receivedAt: "2026-06-18T12:01:00.000Z",
  });

  assert.equal(event.ok, true);
  assert.equal(duplicate.ok, true);

  const inserted = await repository.insertIfNotExists(event.data);
  const repeated = await repository.insertIfNotExists(duplicate.data);
  const byId = await repository.findById("wh_1");
  const byProviderEventId = await repository.findByProviderEventId({
    provider: "fixture",
    providerEventId: "evt_1",
  });

  assert.equal(inserted.inserted, true);
  assert.equal(repeated.inserted, false);
  assert.equal(repeated.event.id, "wh_1");
  assert.equal(byId, event.data);
  assert.equal(byProviderEventId, event.data);
  assert.equal(repository.entries.length, 1);
});

test("in-memory webhook event repository persists status transitions", async () => {
  const core = await loadCore();
  const testing = await loadTesting();
  const repository = testing.createInMemoryWebhookEventRepository();
  const event = core.createWebhookEventEntity({
    id: "wh_1",
    provider: "fixture",
    providerEventId: "evt_1",
    eventName: "subscription.updated",
    rawPayload: { id: "evt_1" },
    receivedAt: "2026-06-18T12:00:00.000Z",
  });

  assert.equal(event.ok, true);
  await repository.insertIfNotExists(event.data);

  const processing = core.markWebhookEventProcessing(event.data, {
    attemptedAt: "2026-06-18T12:02:00.000Z",
  });
  assert.equal(processing.ok, true);
  await repository.save(processing.data);

  const processed = core.markWebhookEventProcessed(processing.data, {
    processedAt: "2026-06-18T12:03:00.000Z",
  });
  assert.equal(processed.ok, true);
  await repository.save(processed.data);

  const stored = await repository.findById("wh_1");
  assert.ok(stored);
  assert.equal(stored.status, "processed");
  assert.equal(stored.processingAttempts, 1);
  assert.equal(stored.processedAt, "2026-06-18T12:03:00.000Z");
});
