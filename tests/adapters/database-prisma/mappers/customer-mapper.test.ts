import assert from "node:assert/strict";
import test from "node:test";
import { prismaCustomerMapper } from "../../../../src/adapters/database-prisma/mappers/customer-mapper.ts";
import { laterTimestamp, makeCustomer, timestamp } from "../support.ts";

test("maps organization customers with nested metadata", () => {
  const customer = makeCustomer();
  const row = prismaCustomerMapper.toPersistence(customer);
  assert.deepEqual(row, {
    id: "customer_1",
    organizationId: "org_1",
    name: "Customer",
    email: "customer@example.com",
    document: "12345678901",
    status: "active",
    metadata: { preferences: { locale: "pt-BR" }, tags: ["a", "b"] },
    createdAt: new Date(timestamp),
    updatedAt: new Date(laterTimestamp),
  });
  assert.deepEqual(prismaCustomerMapper.toDomain(row), customer);
});
