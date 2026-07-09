import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("declares delegates for every persisted aggregate", async () => {
  const source = await readFile(
    new URL("../../../src/adapters/database-prisma/prisma-types.ts", import.meta.url),
    "utf8",
  );
  for (const delegate of [
    "organization",
    "user",
    "userCredentials",
    "customer",
    "membership",
    "plan",
    "subscription",
  ]) {
    assert.match(source, new RegExp(`\\b${delegate}: PrismaModelDelegate`));
  }
});
