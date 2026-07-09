import assert from "node:assert/strict";
import test from "node:test";
import { prismaBillingEventMapper } from "../../../../src/adapters/database-prisma/mappers/billing-event-mapper.ts";
import { prismaDatabaseAdapter } from "../../../../src/adapters/database-prisma/prisma-database-adapter.ts";
import { PrismaBillingEventRepository } from "../../../../src/adapters/database-prisma/repositories/billing-event-repository.ts";
import { PrismaRepositoryContext } from "../../../../src/adapters/database-prisma/repositories/context.ts";
import { makeBillingEvent, makeClient, makeDelegate } from "../support.ts";

test("creates billing events", async () => {
  const event = makeBillingEvent();
  let received: unknown;
  const delegate = makeDelegate({
    create: async (input) => {
      received = input;
    },
  });
  const repository = new PrismaBillingEventRepository(
    new PrismaRepositoryContext(prismaDatabaseAdapter(makeClient({ billingEvent: delegate }))),
  );

  await repository.save(event);

  assert.deepEqual(received, { data: prismaBillingEventMapper.toPersistence(event) });
});
