import assert from "node:assert/strict";
import test from "node:test";
import { prismaMembershipMapper } from "../../../../src/adapters/database-prisma/mappers/membership-mapper.ts";
import { laterTimestamp, makeMembership, timestamp } from "../support.ts";

test("maps actor organization memberships", () => {
  const membership = makeMembership();
  const row = prismaMembershipMapper.toPersistence(membership);
  assert.deepEqual(row, {
    id: "membership_1",
    organizationId: "org_1",
    userId: "user_1",
    role: "employee",
    status: "active",
    invitedByUserId: "owner_1",
    createdAt: new Date(timestamp),
    updatedAt: new Date(laterTimestamp),
  });
  assert.deepEqual(prismaMembershipMapper.toDomain(row), membership);
});
