import assert from "node:assert/strict";
import test from "node:test";
import { prismaCustomerMapper } from "../../../../src/adapters/database-prisma/mappers/customer-mapper.ts";
import { prismaDatabaseAdapter } from "../../../../src/adapters/database-prisma/prisma-database-adapter.ts";
import { PrismaRepositoryContext } from "../../../../src/adapters/database-prisma/repositories/context.ts";
import { PrismaCustomerRepository } from "../../../../src/adapters/database-prisma/repositories/customer-repository.ts";
import { makeClient, makeCustomer, makeDelegate } from "../support.ts";

test("saves, finds and lists organization customers", async () => {
  const customer = makeCustomer();
  const row = prismaCustomerMapper.toPersistence(customer);
  const findFirstWhere: unknown[] = [];
  const delegate = makeDelegate({
    findUnique: async () => row,
    findFirst: async (args) => {
      findFirstWhere.push(args);
      return row;
    },
    findMany: async () => [row],
  });
  const repository = new PrismaCustomerRepository(
    new PrismaRepositoryContext(prismaDatabaseAdapter(makeClient({ customer: delegate }))),
  );
  await repository.save(customer);
  assert.deepEqual(await repository.findById(customer.id), customer);
  assert.deepEqual(await repository.findByEmail("customer@example.com"), customer);
  assert.deepEqual(
    await repository.findByEmailOrganization("customer@example.com", "org_1"),
    customer,
  );
  assert.deepEqual(await repository.listByOrganizationId("org_1"), [customer]);
  assert.deepEqual(findFirstWhere, [
    { where: { email: "customer@example.com" } },
    { where: { email: "customer@example.com", organizationId: "org_1" } },
  ]);
});
