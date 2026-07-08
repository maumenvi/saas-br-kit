import assert from "node:assert/strict";
import test from "node:test";
import { prismaOrganizationMapper } from "../../../../src/adapters/database-prisma/mappers/organization-mapper.ts";
import { prismaDatabaseAdapter } from "../../../../src/adapters/database-prisma/prisma-database-adapter.ts";
import { PrismaRepositoryContext } from "../../../../src/adapters/database-prisma/repositories/context.ts";
import { PrismaOrganizationRepository } from "../../../../src/adapters/database-prisma/repositories/organization-repository.ts";
import { makeClient, makeDelegate, makeOrganization } from "../support.ts";

test("saves, finds and lists organizations", async () => {
  const organization = makeOrganization();
  const row = prismaOrganizationMapper.toPersistence(organization);
  const calls: Record<string, unknown>[] = [];
  let findUniqueCalls = 0;
  const delegate = makeDelegate({
    upsert: async (input) => {
      calls.push(input);
    },
    findUnique: async (input) => {
      calls.push(input);
      findUniqueCalls += 1;
      return findUniqueCalls === 1 ? row : null;
    },
    findMany: async (input) => {
      calls.push(input);
      return [row];
    },
  });
  const repository = new PrismaOrganizationRepository(
    new PrismaRepositoryContext(prismaDatabaseAdapter(makeClient({ organization: delegate }))),
  );

  await repository.save(organization);
  assert.deepEqual(calls[0], {
    where: { id: "org_1" },
    create: row,
    update: row,
  });
  assert.deepEqual(await repository.findById("org_1"), organization);
  assert.equal(await repository.findById("missing"), null);
  assert.deepEqual(await repository.listByOwnerUserId("user_1"), [organization]);
  assert.deepEqual(calls[3], {
    where: { ownerUserId: "user_1" },
    orderBy: { createdAt: "asc" },
  });
});
