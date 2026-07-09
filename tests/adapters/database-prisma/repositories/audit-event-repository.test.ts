import assert from "node:assert/strict";
import test from "node:test";
import { prismaAuditEventMapper } from "../../../../src/adapters/database-prisma/mappers/audit-event-mapper.ts";
import { prismaDatabaseAdapter } from "../../../../src/adapters/database-prisma/prisma-database-adapter.ts";
import { PrismaAuditEventRepository } from "../../../../src/adapters/database-prisma/repositories/audit-event-repository.ts";
import { PrismaRepositoryContext } from "../../../../src/adapters/database-prisma/repositories/context.ts";
import { makeAuditEvent, makeClient, makeDelegate } from "../support.ts";

test("creates audit events", async () => {
  const event = makeAuditEvent();
  let received: unknown;
  const delegate = makeDelegate({
    create: async (input) => {
      received = input;
    },
  });
  const repository = new PrismaAuditEventRepository(
    new PrismaRepositoryContext(prismaDatabaseAdapter(makeClient({ auditEvent: delegate }))),
  );

  await repository.save(event);

  assert.deepEqual(received, { data: prismaAuditEventMapper.toPersistence(event) });
});
