import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();
const loadCore = async () => import(pathToFileURL(path.join(rootDir, "src/core/index.ts")).href);
const loadUseCaseModule = async () =>
  import(pathToFileURL(path.join(rootDir, "src/core/application/shared/use-case.ts")).href);

test("UseCaseRunner returns successful and failed operation results without mutation", async () => {
  const core = await loadCore();
  const { UseCaseRunner } = await loadUseCaseModule();
  const runner = new UseCaseRunner();
  const okResult = core.ok(Object.freeze({ value: "ok" }));
  const failResult = core.fail(
    core.createCoreError({
      kind: "business",
      code: "fixture.expected_failure",
      message: "Expected failure.",
    }),
  );

  const success = await runner.runSafely(async () => okResult);
  const failure = await runner.runSafely(async () => failResult);

  assert.equal(success, okResult);
  assert.equal(failure, failResult);
});

test("UseCaseRunner converts thrown dependency errors to infrastructure failures", async () => {
  const { UseCaseRunner } = await loadUseCaseModule();
  const runner = new UseCaseRunner();

  const result = await runner.runSafely(async () => {
    throw new Error("database timeout");
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.kind, "infrastructure");
    assert.equal(result.error.code, "core.infrastructure_failure");
    assert.equal(result.error.retryable, true);
  }
});

test("runUseCaseSafely compatibility facade delegates to shared runner", async () => {
  const core = await loadCore();
  const { runUseCaseSafely } = await loadUseCaseModule();
  const expected = core.ok(Object.freeze({ value: 42 }));

  const success = await runUseCaseSafely(async () => expected);
  const failure = await runUseCaseSafely(async () => {
    throw new Error("service unavailable");
  });

  assert.equal(success, expected);
  assert.equal(failure.ok, false);
  if (!failure.ok) {
    assert.equal(failure.error.code, "core.infrastructure_failure");
  }
});
