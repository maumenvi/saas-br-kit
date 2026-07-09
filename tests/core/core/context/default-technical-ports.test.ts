import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();
const loadDefaults = async () =>
  import(pathToFileURL(path.join(rootDir, "src/core/context/default-technical-ports.ts")).href);

test("default technical ports provide system clock and UUIDv7 ids", async () => {
  const { systemClock, uuidV7IdGenerator } = await loadDefaults();

  const now = systemClock.now();
  const first = uuidV7IdGenerator.newId();
  const second = uuidV7IdGenerator.newId();

  assert.equal(now instanceof Date, true);
  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.match(second, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.notEqual(first, second);
});

test("consoleLogger sanitizes sensitive fields for every log level", async () => {
  const { REDACTED_LOG_VALUE } = await import(
    pathToFileURL(path.join(rootDir, "src/core/ports/logger.ts")).href
  );
  const { consoleLogger } = await loadDefaults();
  const calls = [];
  const original = {
    debug: console.debug,
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  console.debug = (...args) => calls.push({ level: "debug", args });
  console.log = (...args) => calls.push({ level: "info", args });
  console.warn = (...args) => calls.push({ level: "warn", args });
  console.error = (...args) => calls.push({ level: "error", args });

  try {
    const context = Object.freeze({
      password: "secret-password",
      nested: Object.freeze({ token: "token-value" }),
      safe: "value",
    });

    consoleLogger.debug("debug-message", context);
    consoleLogger.info("info-message");
    consoleLogger.warn("warn-message", { authorization: "Bearer abc" });
    consoleLogger.error("error-message", { payload: { id: "raw" } });
  } finally {
    console.debug = original.debug;
    console.log = original.log;
    console.warn = original.warn;
    console.error = original.error;
  }

  assert.equal(calls.length, 4);
  assert.equal(calls[0].args[0], "debug-message");
  assert.equal(calls[0].args[1].password, REDACTED_LOG_VALUE);
  assert.equal(calls[0].args[1].nested.token, REDACTED_LOG_VALUE);
  assert.equal(calls[0].args[1].safe, "value");
  assert.equal(Object.isFrozen(calls[0].args[1]), true);
  assert.equal(calls[1].args[0], "info-message");
  assert.equal(calls[1].args[1], undefined);
  assert.equal(calls[2].args[1].authorization, REDACTED_LOG_VALUE);
  assert.equal(calls[3].args[1].payload, REDACTED_LOG_VALUE);
});
