import assert from "node:assert/strict";
import test from "node:test";
import { prismaDatabaseAdapter } from "../../../../src/adapters/database-prisma/prisma-database-adapter.ts";
import {
  createPrismaBillingRepositories,
  PrismaAuditEventRepository,
  PrismaBillingEventRepository,
  PrismaOrganizationRepository,
  PrismaPlanRepository,
  PrismaSubscriptionRepository,
  PrismaWebhookEventRepository,
} from "../../../../src/adapters/database-prisma/repositories/index.ts";
import { makeClient } from "../support.ts";

test("creates and freezes the complete repository collection", () => {
  const repositories = createPrismaBillingRepositories(prismaDatabaseAdapter(makeClient()));

  assert.equal(Object.isFrozen(repositories), true);
  assert.equal(repositories.organizations instanceof PrismaOrganizationRepository, true);
  assert.equal(repositories.plans instanceof PrismaPlanRepository, true);
  assert.equal(repositories.subscriptions instanceof PrismaSubscriptionRepository, true);
  assert.equal(repositories.billingEvents instanceof PrismaBillingEventRepository, true);
  assert.equal(repositories.auditEvents instanceof PrismaAuditEventRepository, true);
  assert.equal(repositories.webhookEvents instanceof PrismaWebhookEventRepository, true);
});
