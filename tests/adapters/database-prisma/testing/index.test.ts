import assert from "node:assert/strict";
import test from "node:test";
import * as testing from "../../../../src/adapters/database-prisma/testing/index.ts";

test("exports the public testing helpers", () => {
  assert.equal(typeof testing.resetPrismaAdapterData, "function");
  assert.equal(typeof testing.seedPrismaBillingSlice, "function");
});
