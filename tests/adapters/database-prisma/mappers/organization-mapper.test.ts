import assert from "node:assert/strict";
import test from "node:test";
import { prismaOrganizationMapper } from "../../../../src/adapters/database-prisma/mappers/organization-mapper.ts";
import { laterTimestamp, makeOrganization, timestamp } from "../support.ts";

test("maps organizations to persistence and back", () => {
  const organization = makeOrganization();
  const persisted = prismaOrganizationMapper.toPersistence(organization);

  assert.deepEqual(persisted, {
    id: "org_1",
    ownerUserId: "user_1",
    name: "Acme",
    status: "disabled",
    roleConfig: {
      ownerRoleName: "owner",
      employeeRoles: [{ name: "employee", permissions: ["*"] }],
    },
    metadata: { source: "test", seats: 3 },
    createdAt: new Date(timestamp),
    updatedAt: new Date(laterTimestamp),
  });

  const restored = prismaOrganizationMapper.toDomain(persisted);
  assert.deepEqual(restored, organization);
});

test("defaults unknown status and excludes invalid metadata", () => {
  const restored = prismaOrganizationMapper.toDomain({
    id: "org_1",
    ownerUserId: "user_1",
    name: "Acme",
    status: "unknown",
    metadata: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  assert.equal(restored.status, "active");
  assert.equal(restored.metadata, undefined);
  assert.equal(prismaOrganizationMapper.toPersistence(restored).metadata, undefined);
  assert.throws(
    () =>
      prismaOrganizationMapper.toDomain({
        ...prismaOrganizationMapper.toPersistence(makeOrganization()),
        id: "",
      }),
    /organization\.id/,
  );
});
