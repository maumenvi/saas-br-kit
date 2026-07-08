import assert from "node:assert/strict";
import test from "node:test";
import { nestRuntimeAdapter, SaasBrModule } from "../../../dist/adapters/runtime-nest/index.js";

test("exports an independent Nest runtime adapter", async () => {
  const adapter = nestRuntimeAdapter();

  assert.equal(adapter.client.module, SaasBrModule);
  assert.deepEqual(await adapter.healthCheck(), { status: "up" });
});
