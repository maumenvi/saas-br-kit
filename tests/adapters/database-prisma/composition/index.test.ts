import assert from "node:assert/strict";
import test from "node:test";
import { prismaCoreAdapter } from "../../../../src/adapters/database-prisma/composition/index.ts";

test("exports the Prisma Core composition surface", () => {
  assert.equal(typeof prismaCoreAdapter, "function");
});
