import assert from "node:assert/strict";
import test from "node:test";
import * as mappers from "../../../../src/adapters/database-prisma/mappers/index.ts";

test("exports the public mapper surface", () => {
  assert.equal(typeof mappers.PrismaAuditEventMapper, "function");
  assert.equal(typeof mappers.PrismaBillingEventMapper, "function");
  assert.equal(typeof mappers.PrismaOrganizationMapper, "function");
  assert.equal(typeof mappers.PrismaPlanMapper, "function");
  assert.equal(typeof mappers.PrismaSubscriptionMapper, "function");
  assert.equal(typeof mappers.PrismaWebhookEventMapper, "function");
  assert.equal(typeof mappers.asRow, "function");
});
