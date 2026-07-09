import assert from "node:assert/strict";
import test from "node:test";
import { prismaPlanMapper } from "../../../../src/adapters/database-prisma/mappers/plan-mapper.ts";
import { laterTimestamp, makePlan, timestamp } from "../support.ts";

test("maps plans to persistence and back", () => {
  const plan = makePlan();
  const persisted = prismaPlanMapper.toPersistence(plan);

  assert.deepEqual(persisted, {
    id: "plan_1",
    organizationId: "org_1",
    code: "pro",
    name: "Pro",
    amountCents: 9900,
    currency: "BRL",
    interval: "monthly",
    features: ["reports", "exports"],
    status: "inactive",
    metadata: { source: "test", featured: true },
    createdAt: new Date(timestamp),
    updatedAt: new Date(laterTimestamp),
  });
  assert.deepEqual(prismaPlanMapper.toDomain(persisted), plan);
});

test("normalizes optional persistence values", () => {
  const restored = prismaPlanMapper.toDomain({
    id: "plan_1",
    organizationId: "org_1",
    code: "pro",
    name: "Pro",
    amountCents: 9900,
    currency: "BRL",
    interval: "monthly",
    features: "invalid",
    status: "unknown",
    metadata: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  assert.deepEqual(restored.features, []);
  assert.equal(restored.status, "active");
  assert.equal(restored.metadata, undefined);
  assert.throws(
    () => prismaPlanMapper.toDomain({ ...prismaPlanMapper.toPersistence(makePlan()), id: "" }),
    /plan\.id/,
  );
});
