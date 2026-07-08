import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();
const loadResult = async () =>
  import(pathToFileURL(path.join(rootDir, "src/core/errors/result.ts")).href);

test("CoreResultFactory creates immutable success and failure results", async () => {
  const { CoreResultFactory } = await loadResult();
  const factory = new CoreResultFactory();
  const okResult = factory.ok(Object.freeze({ value: 1 }));
  const error = Object.freeze({
    kind: "validation",
    code: "fixture.invalid",
    message: "Invalid",
  });
  const failResult = factory.fail(error);

  assert.equal(okResult.ok, true);
  assert.deepEqual(okResult.data, { value: 1 });
  assert.equal(Object.isFrozen(okResult), true);
  assert.equal(failResult.ok, false);
  assert.equal(failResult.error, error);
  assert.equal(Object.isFrozen(failResult), true);
});

test("CoreResultFactory normalizes error details and optional retryable", async () => {
  const { CoreResultFactory } = await loadResult();
  const factory = new CoreResultFactory();
  const details = { provider: "fixture" };

  const withDetails = factory.createError({
    kind: "external",
    code: "fixture.failed",
    message: "External failure",
    details,
    retryable: true,
  });
  const withoutOptional = factory.createError({
    kind: "domain",
    code: "fixture.domain",
    message: "Domain failure",
  });

  details.provider = "mutated";

  assert.equal(withDetails.kind, "external");
  assert.equal(withDetails.retryable, true);
  assert.deepEqual(withDetails.details, { provider: "fixture" });
  assert.equal(Object.isFrozen(withDetails), true);
  assert.equal(Object.isFrozen(withDetails.details), true);
  assert.equal("details" in withoutOptional, false);
  assert.equal("retryable" in withoutOptional, false);
});

test("result facade helpers delegate to shared factory", async () => {
  const { createCoreError, fail, ok, coreResult } = await loadResult();
  const success = ok("value");
  const error = createCoreError({
    kind: "infrastructure",
    code: "fixture.down",
    message: "Down",
    retryable: true,
  });
  const failure = fail(error);
  const direct = coreResult.fail(error);

  assert.equal(success.ok, true);
  assert.equal(success.data, "value");
  assert.equal(failure.ok, false);
  assert.deepEqual(failure.error, error);
  assert.deepEqual(direct, failure);
});
