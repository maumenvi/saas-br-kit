import assert from "node:assert/strict";
import test from "node:test";
import { prismaPlanMapper } from "../../../../src/adapters/database-prisma/mappers/plan-mapper.ts";
import { prismaDatabaseAdapter } from "../../../../src/adapters/database-prisma/prisma-database-adapter.ts";
import { PrismaRepositoryContext } from "../../../../src/adapters/database-prisma/repositories/context.ts";
import { PrismaPlanRepository } from "../../../../src/adapters/database-prisma/repositories/plan-repository.ts";
import { makeClient, makeDelegate, makePlan } from "../support.ts";

test("saves and finds plans by organization, id and code", async () => {
  const plan = makePlan();
  const row = prismaPlanMapper.toPersistence(plan);
  const calls: Record<string, unknown>[] = [];
  const results = [row, null, row, null];
  const find = async (input: Record<string, unknown>) => {
    calls.push(input);
    return results.shift() ?? null;
  };
  const delegate = makeDelegate({
    upsert: async (input) => {
      calls.push(input);
    },
    findFirst: find,
    findUnique: find,
  });
  const repository = new PrismaPlanRepository(
    new PrismaRepositoryContext(prismaDatabaseAdapter(makeClient({ plan: delegate }))),
  );

  await repository.save(plan);
  assert.deepEqual(calls[0], {
    where: { id: "plan_1" },
    create: row,
    update: row,
  });
  assert.deepEqual(await repository.findById("org_1", "plan_1"), plan);
  assert.equal(await repository.findById("org_1", "missing"), null);
  assert.deepEqual(await repository.findByCode("org_1", "pro"), plan);
  assert.equal(await repository.findByCode("org_1", "missing"), null);
  assert.deepEqual(calls.slice(1), [
    { where: { id: "plan_1", organizationId: "org_1" } },
    { where: { id: "missing", organizationId: "org_1" } },
    { where: { organizationId_code: { organizationId: "org_1", code: "pro" } } },
    { where: { organizationId_code: { organizationId: "org_1", code: "missing" } } },
  ]);
});

test("lists only plans from the requested organization", async () => {
  const plan = makePlan();
  const row = prismaPlanMapper.toPersistence(plan);
  const calls: Record<string, unknown>[] = [];
  const delegate = makeDelegate({
    findMany: async (input) => {
      calls.push(input);
      return [row];
    },
  });
  const repository = new PrismaPlanRepository(
    new PrismaRepositoryContext(prismaDatabaseAdapter(makeClient({ plan: delegate }))),
  );

  assert.deepEqual(await repository.listByOrganizationId("org_1"), [plan]);
  assert.deepEqual(calls, [
    {
      where: { organizationId: "org_1" },
      orderBy: { createdAt: "asc" },
    },
  ]);
});
