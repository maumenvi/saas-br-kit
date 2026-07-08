import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();

const importTesting = () => import(pathToFileURL(path.join(rootDir, "src/testing/index.ts")));

test("fixed clock snapshots input date and returns isolated Date instances", async () => {
  const { FixedClock, createFixedClock } = await importTesting();
  const input = new Date("2026-06-18T00:00:00.000Z");
  const clock = createFixedClock(input);

  input.setUTCFullYear(2030);
  const first = clock.now();
  const second = clock.now();
  first.setUTCFullYear(2040);

  assert.equal(clock instanceof FixedClock, true);
  assert.equal(Object.isFrozen(clock), true);
  assert.equal(first.toISOString(), "2040-06-18T00:00:00.000Z");
  assert.equal(second.toISOString(), "2026-06-18T00:00:00.000Z");
  assert.equal(clock.now().toISOString(), "2026-06-18T00:00:00.000Z");
  assert.notEqual(first, second);
});

test("sequential id generators keep isolated counters", async () => {
  const { SequentialIdGenerator, createSequentialIdGenerator } = await importTesting();
  const first = createSequentialIdGenerator("org");
  const second = createSequentialIdGenerator("org");

  assert.equal(first instanceof SequentialIdGenerator, true);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(first.newId(), "org_1");
  assert.equal(first.newId(), "org_2");
  assert.equal(second.newId(), "org_1");
});

test("noop logger implements LoggerPort without retaining context", async () => {
  const { NoopLogger, createNoopLogger } = await importTesting();
  const logger = createNoopLogger();

  assert.equal(logger instanceof NoopLogger, true);
  assert.equal(Object.isFrozen(logger), true);
  assert.doesNotThrow(() => {
    logger.debug("debug", { requestId: "req_1" });
    logger.info("info", { requestId: "req_1" });
    logger.warn("warn", { requestId: "req_1" });
    logger.error("error", { requestId: "req_1" });
  });
});

test("in-memory logger captures immutable entries and cloned contexts", async () => {
  const { InMemoryLoggerAdapter, createInMemoryLogger } = await importTesting();
  const logger = createInMemoryLogger();
  const context = { requestId: "req_1" };

  logger.info("created", context);
  context.requestId = "req_2";

  assert.equal(logger instanceof InMemoryLoggerAdapter, true);
  assert.equal(Object.isFrozen(logger), true);
  assert.deepEqual(logger.entries, [
    {
      level: "info",
      message: "created",
      context: { requestId: "req_1" },
    },
  ]);
  assert.equal(Object.isFrozen(logger.entries), true);
  assert.equal(Object.isFrozen(logger.entries[0]), true);
  assert.equal(Object.isFrozen(logger.entries[0].context), true);
  assert.throws(() => logger.entries.push({ level: "debug", message: "late" }), TypeError);
  assert.throws(() => Object.assign(logger.entries[0].context, { requestId: "req_3" }), TypeError);

  logger.clear();

  assert.deepEqual(logger.entries, []);
});

test("in-memory logger redacts sensitive log fields", async () => {
  const { createInMemoryLogger } = await importTesting();
  const logger = createInMemoryLogger();

  logger.warn("webhook.failed", {
    requestId: "req_1",
    authorization: "Bearer secret",
    cookie: "session=secret",
    accessToken: "access_secret",
    refresh_token: "refresh_secret",
    apiKey: "api_secret",
    connectionString: "postgres://user:pass@example/db",
    webhookPayload: {
      token: "nested_secret",
      event: "PAYMENT_CONFIRMED",
    },
    nested: {
      password: "password_secret",
      safe: "visible",
    },
  });

  assert.deepEqual(logger.entries[0].context, {
    requestId: "req_1",
    authorization: "[REDACTED]",
    cookie: "[REDACTED]",
    accessToken: "[REDACTED]",
    refresh_token: "[REDACTED]",
    apiKey: "[REDACTED]",
    connectionString: "[REDACTED]",
    webhookPayload: "[REDACTED]",
    nested: {
      password: "[REDACTED]",
      safe: "visible",
    },
  });
});

test("passthrough transaction manager creates isolated transaction scopes", async () => {
  const { PassthroughTransactionManager, createPassthroughTransactionManager } =
    await importTesting();
  const metadata = { source: "unit" };
  const transactionManager = createPassthroughTransactionManager({
    idPrefix: "tx",
    metadata,
  });

  metadata.source = "mutated";

  const first = await transactionManager.runInTransaction(async (transaction) => {
    assert.equal(Object.isFrozen(transaction), true);
    assert.equal(Object.isFrozen(transaction.metadata), true);
    assert.deepEqual(transaction.metadata, { source: "unit" });
    return transaction.id;
  });
  const second = await transactionManager.runInTransaction(async (transaction) => transaction.id);

  assert.equal(transactionManager instanceof PassthroughTransactionManager, true);
  assert.equal(Object.isFrozen(transactionManager), true);
  assert.deepEqual([first, second], ["tx_1", "tx_2"]);
});
