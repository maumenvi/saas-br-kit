import assert from "node:assert/strict";
import test from "node:test";
import { resetPrismaAdapterData } from "../../../../src/adapters/database-prisma/testing/reset.ts";
import { makeClient, makeDelegate } from "../support.ts";

test("deletes adapter data in dependency order", async () => {
  const order: string[] = [];
  const delegate = (name: string) =>
    makeDelegate({
      deleteMany: async () => {
        order.push(name);
      },
    });
  const client = makeClient({
    webhookEvent: delegate("webhookEvent"),
    billingEvent: delegate("billingEvent"),
    auditEvent: delegate("auditEvent"),
    subscription: delegate("subscription"),
    plan: delegate("plan"),
    organization: delegate("organization"),
  });

  await resetPrismaAdapterData(client);

  assert.deepEqual(order, [
    "webhookEvent",
    "billingEvent",
    "auditEvent",
    "subscription",
    "plan",
    "organization",
  ]);
});

test("supports delegates without optional delete operations", async () => {
  const delegate = makeDelegate();
  const { deleteMany: _, ...withoutDeleteMany } = delegate;
  const client = makeClient({
    webhookEvent: withoutDeleteMany,
    billingEvent: withoutDeleteMany,
    auditEvent: withoutDeleteMany,
    subscription: withoutDeleteMany,
    plan: withoutDeleteMany,
    organization: withoutDeleteMany,
  });

  await resetPrismaAdapterData(client);
});
