import assert from "node:assert/strict";
import test from "node:test";
import { prismaMembershipMapper } from "../../../../src/adapters/database-prisma/mappers/membership-mapper.ts";
import { prismaDatabaseAdapter } from "../../../../src/adapters/database-prisma/prisma-database-adapter.ts";
import { PrismaRepositoryContext } from "../../../../src/adapters/database-prisma/repositories/context.ts";
import { PrismaMembershipRepository } from "../../../../src/adapters/database-prisma/repositories/membership-repository.ts";
import { makeClient, makeDelegate, makeMembership } from "../support.ts";

test("saves and queries actor organization memberships", async () => {
  const membership = makeMembership();
  const row = prismaMembershipMapper.toPersistence(membership);
  const delegate = makeDelegate({
    findUnique: async () => row,
    findFirst: async () => row,
    findMany: async () => [row],
  });
  const repository = new PrismaMembershipRepository(
    new PrismaRepositoryContext(prismaDatabaseAdapter(makeClient({ membership: delegate }))),
  );
  await repository.save(membership);
  assert.deepEqual(await repository.findById(membership.id), membership);
  assert.deepEqual(
    await repository.findByOrganizationIdAndUserId({
      organizationId: "org_1",
      userId: "user_1",
    }),
    membership,
  );
  assert.deepEqual(await repository.listByUserId("user_1"), [membership]);
  assert.deepEqual(await repository.listByOrganizationId("org_1"), [membership]);
});
