import assert from "node:assert/strict";
import test from "node:test";
import { seedPrismaBillingSlice } from "../../../../src/adapters/database-prisma/testing/seed.ts";
import { timestamp } from "../support.ts";

test("seeds the minimum organization and plan", async () => {
  const saved: unknown[] = [];

  await seedPrismaBillingSlice({
    repositories: {
      organizations: {
        save: async (organization) => {
          saved.push(organization);
        },
        findById: async () => null,
        listByOwnerUserId: async () => [],
      },
      plans: {
        save: async (plan) => {
          saved.push(plan);
        },
        findById: async () => null,
        findByCode: async () => null,
        listByOrganizationId: async () => [],
      },
    },
    now: timestamp,
  });

  assert.equal(saved.length, 2);
  assert.deepEqual(
    saved.map((entity) => ({
      id: (entity as { id: string }).id,
      createdAt: (entity as { createdAt: string }).createdAt,
    })),
    [
      { id: "org_seed", createdAt: timestamp },
      { id: "plan_seed", createdAt: timestamp },
    ],
  );
});

test("rejects an invalid seed timestamp", async () => {
  await assert.rejects(
    seedPrismaBillingSlice({
      repositories: {
        organizations: {
          save: async () => undefined,
          findById: async () => null,
          listByOwnerUserId: async () => [],
        },
        plans: {
          save: async () => undefined,
          findById: async () => null,
          findByCode: async () => null,
          listByOrganizationId: async () => [],
        },
      },
      now: "invalid",
    }),
    /organization\.createdAt/,
  );
});

test("uses the current time when a seed timestamp is omitted", async () => {
  const timestamps: string[] = [];
  await seedPrismaBillingSlice({
    repositories: {
      organizations: {
        save: async (organization) => {
          timestamps.push(organization.createdAt);
        },
        findById: async () => null,
        listByOwnerUserId: async () => [],
      },
      plans: {
        save: async (plan) => {
          timestamps.push(plan.createdAt);
        },
        findById: async () => null,
        findByCode: async () => null,
        listByOrganizationId: async () => [],
      },
    },
  });

  assert.equal(timestamps.length, 2);
  assert.equal(timestamps[0], timestamps[1]);
  assert.equal(Number.isNaN(Date.parse(timestamps[0] ?? "")), false);
});
